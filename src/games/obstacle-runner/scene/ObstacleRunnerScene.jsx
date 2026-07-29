import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import EnvironmentManager from "./EnvironmentManager";
import InputController from "./InputController";
import PlayerController from "./PlayerController";
import RunnerCamera from "./RunnerCamera";
import TrackManager from "./TrackManager";
import { RUNNER_CONFIG } from "./runnerConfig";

export default function ObstacleRunnerScene({ runnerStateRef, onHudTick, onCharacterAssetInfo }) {
  return (
    <Canvas
      className="or-three-canvas"
      shadows
      dpr={RUNNER_CONFIG.world.pixelRatio}
      camera={{ fov: RUNNER_CONFIG.camera.fov, position: [0, RUNNER_CONFIG.camera.height, RUNNER_CONFIG.camera.followDistance] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ scene, gl }) => {
        scene.background = new THREE.Color("#8bd8ff");
        scene.fog = new THREE.Fog("#9ed8d6", RUNNER_CONFIG.world.fogNear, RUNNER_CONFIG.world.fogFar);
        gl.setClearColor("#8bd8ff");
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <hemisphereLight args={["#dff7ff", "#4f7f3c", 1.45]} />
        <ambientLight intensity={0.42} />
        <directionalLight
          position={[-12, 18, 10]}
          intensity={2.15}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-32}
          shadow-camera-right={32}
          shadow-camera-top={32}
          shadow-camera-bottom={-32}
        />
        <EnvironmentManager />
        <TrackManager runnerStateRef={runnerStateRef} />
        <PlayerController runnerStateRef={runnerStateRef} onHudTick={onHudTick} onCharacterAssetInfo={onCharacterAssetInfo} />
        <RunnerCamera runnerStateRef={runnerStateRef} />
        <InputController runnerStateRef={runnerStateRef} />
      </Suspense>
    </Canvas>
  );
}
