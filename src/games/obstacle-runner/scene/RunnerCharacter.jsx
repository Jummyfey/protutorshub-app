import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { createGeneratedRunnerClips } from "./generatedRunnerClips";
import { mapAnimationClips } from "./runnerAnimationMap";
import { RUNNER_CONFIG } from "./runnerConfig";

function getLoader(assetPath) {
  return assetPath.toLowerCase().endsWith(".fbx") ? FBXLoader : GLTFLoader;
}

function getLoadedScene(asset) {
  return asset.scene || asset;
}

function getLoadedClips(asset) {
  return asset.animations || [];
}

function alignCharacterToController(root, targetHeight) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const height = Math.max(0.001, size.y);
  const scale = targetHeight / height;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(root);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBounds.min.y;

  return {
    scale,
    originalHeight: height,
    finalHeight: targetHeight,
    verticalOffset: root.position.y,
  };
}

export default function RunnerCharacter({ assetPath, runnerStateRef, actionStateRef, onAssetInfo }) {
  const Loader = getLoader(assetPath);
  const loadedAsset = useLoader(Loader, assetPath);
  const visualRootRef = useRef(null);
  const mixerRef = useRef(null);
  const currentActionRef = useRef(null);
  const currentStateRef = useRef("");
  const basePositionRef = useRef(new THREE.Vector3());
  const [assetInfo, setAssetInfo] = useState(null);

  const model = useMemo(() => {
    const source = getLoadedScene(loadedAsset);
    const cloned = clone(source);
    cloned.rotation.y = RUNNER_CONFIG.character.forwardRotation;
    cloned.traverse((node) => {
      if (node.isMesh || node.isSkinnedMesh) {
        node.castShadow = true;
        node.receiveShadow = false;
        node.frustumCulled = true;
      }
      const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
      materials.forEach((material) => {
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
        if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        material.needsUpdate = true;
      });
    });
    const alignment = alignCharacterToController(cloned, RUNNER_CONFIG.character.targetHeight);
    return { root: cloned, alignment };
  }, [loadedAsset]);

  const authoredClips = useMemo(() => getLoadedClips(loadedAsset), [loadedAsset]);
  const generatedClips = useMemo(() => createGeneratedRunnerClips(model.root, authoredClips), [authoredClips, model.root]);
  const allClips = useMemo(() => [...authoredClips, ...generatedClips], [authoredClips, generatedClips]);
  const clipMap = useMemo(() => mapAnimationClips(allClips), [allClips]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(model.root);
    mixerRef.current = mixer;
    basePositionRef.current.copy(model.root.position);

    const names = allClips.map((clip) => clip.name);
    const info = {
      assetPath,
      clipNames: names,
      mappings: Object.fromEntries(Object.entries(clipMap).map(([state, clip]) => [state, clip?.name || null])),
      alignment: model.alignment,
      temporary: false,
      licensedExternal: false,
      attribution: RUNNER_CONFIG.character.attribution,
      missingAnimations: names.length === 0,
      authoredClipNames: authoredClips.map((clip) => clip.name),
      generatedClipNames: generatedClips.map((clip) => clip.name),
    };
    setAssetInfo(info);
    onAssetInfo?.(info);

    const runClip = clipMap.Run;
    if (runClip) {
      const action = mixer.clipAction(runClip);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      currentActionRef.current = action;
      currentStateRef.current = "Run";
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model.root);
      mixerRef.current = null;
    };
  }, [allClips, assetPath, authoredClips, clipMap, generatedClips, model, onAssetInfo]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    const runnerState = runnerStateRef.current;
    const requestedState = actionStateRef.current || "Run";
    const nextState = runnerState.paused ? "Idle" : requestedState;

    if (nextState !== currentStateRef.current && clipMap[nextState]) {
      const fade = nextState === "Land"
        ? RUNNER_CONFIG.character.fadeDurations.land
        : nextState === "Stumble"
          ? RUNNER_CONFIG.character.fadeDurations.stumble
          : RUNNER_CONFIG.character.fadeDurations.ordinary;
      const nextAction = mixer.clipAction(clipMap[nextState]);
      nextAction.enabled = true;
      nextAction.reset();
      nextAction.setLoop(nextState === "Run" || nextState === "Idle" || nextState === "JumpLoop" ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      nextAction.clampWhenFinished = nextState !== "Run" && nextState !== "Idle";
      nextAction.play();
      if (currentActionRef.current && currentActionRef.current !== nextAction) {
        currentActionRef.current.crossFadeTo(nextAction, fade, false);
      }
      currentActionRef.current = nextAction;
      currentStateRef.current = nextState;
    }

    if (currentActionRef.current) {
      currentActionRef.current.timeScale = Math.max(0.4, runnerState.speed * RUNNER_CONFIG.character.playbackMultiplier);
    }

    mixer.update(Math.min(delta, 0.05));
    model.root.position.copy(basePositionRef.current);
  });

  return (
    <group ref={visualRootRef} name="CharacterVisualRoot">
      <primitive object={model.root} />
    </group>
  );
}
