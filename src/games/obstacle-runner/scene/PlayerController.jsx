import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import RunnerCharacter from "./RunnerCharacter";
import { RUNNER_CONFIG } from "./runnerConfig";

const tmpColor = new THREE.Color();

export default function PlayerController({ runnerStateRef, onHudTick, onCharacterAssetInfo }) {
  const controllerRef = useRef(null);
  const visualRootRef = useRef(null);
  const colliderRef = useRef(null);
  const actionStateRef = useRef("Run");
  const hudTimerRef = useRef(0);

  const colliderMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#facc15",
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  }), []);

  useFrame(({ clock }, delta) => {
    const state = runnerStateRef.current;
    const safeDelta = Math.min(delta, 0.05);

    if (state.action == null) state.action = "Run";
    if (state.verticalVelocity == null) state.verticalVelocity = 0;
    if (state.airborne == null) state.airborne = false;
    if (state.colliderHeight == null) state.colliderHeight = RUNNER_CONFIG.character.collider.height;

    if (!state.paused) {
      state.speed = Math.min(RUNNER_CONFIG.movement.maxSpeed, state.speed + RUNNER_CONFIG.movement.acceleration * safeDelta);
      state.z -= state.speed * safeDelta;
      state.distance += state.speed * safeDelta;
    }

    const targetX = RUNNER_CONFIG.lanes[state.targetLane];
    const previousX = state.x;
    state.x = THREE.MathUtils.damp(state.x, targetX, RUNNER_CONFIG.movement.laneSwitchSmoothing, safeDelta);
    state.lane = state.targetLane;

    const groundY = getTrackHeight(state.z);
    if (state.airborne) {
      state.verticalVelocity -= 18 * safeDelta;
      state.y = (state.y || groundY) + state.verticalVelocity * safeDelta;
      if (state.y <= groundY) {
        state.y = groundY;
        state.airborne = false;
        state.action = "Land";
        state.actionUntil = clock.elapsedTime + 0.16;
      } else if (state.verticalVelocity < 0) {
        state.action = "JumpLoop";
      }
    } else {
      state.y = groundY;
    }

    if (state.requestedAction === "Jump" && !state.airborne) {
      state.airborne = true;
      state.verticalVelocity = 7.2;
      state.action = "JumpStart";
      state.actionUntil = clock.elapsedTime + 0.18;
      state.requestedAction = null;
    }

    if (state.requestedAction === "Slide" && !state.airborne) {
      state.action = "Slide";
      state.actionUntil = clock.elapsedTime + 0.62;
      state.colliderHeight = RUNNER_CONFIG.character.collider.slideHeight;
      state.requestedAction = null;
    }

    if (state.requestedAction === "Stumble") {
      state.action = "Stumble";
      state.actionUntil = clock.elapsedTime + 0.55;
      state.speed = Math.max(RUNNER_CONFIG.movement.baseSpeed * 0.78, state.speed - 1.2);
      state.requestedAction = null;
    }

    if (state.actionUntil && clock.elapsedTime >= state.actionUntil && !state.airborne) {
      state.action = "Run";
      state.actionUntil = null;
      state.colliderHeight = RUNNER_CONFIG.character.collider.height;
    }

    if (state.paused) {
      actionStateRef.current = "Idle";
    } else {
      actionStateRef.current = state.action || "Run";
    }

    controllerRef.current.position.set(state.x, state.y, state.z);
    const lateralVelocity = (state.x - previousX) / Math.max(0.001, safeDelta);
    const lean = THREE.MathUtils.clamp(-lateralVelocity * RUNNER_CONFIG.character.leanStrength * 0.025, -0.18, 0.18);
    visualRootRef.current.rotation.z = THREE.MathUtils.damp(visualRootRef.current.rotation.z, lean, 9, safeDelta);
    visualRootRef.current.rotation.y = THREE.MathUtils.damp(visualRootRef.current.rotation.y, (targetX - state.x) * -0.035, 8, safeDelta);

    colliderRef.current.scale.y = state.colliderHeight / RUNNER_CONFIG.character.collider.height;
    colliderRef.current.visible = Boolean(state.debug);

    hudTimerRef.current += safeDelta;
    if (hudTimerRef.current > 0.18) {
      hudTimerRef.current = 0;
      onHudTick?.({
        distance: state.distance,
        speed: state.speed,
        lane: state.targetLane,
        activeSegments: RUNNER_CONFIG.track.activeSegments,
      });
    }
  });

  return (
    <group ref={controllerRef} name="PlayerController">
      <mesh
        ref={colliderRef}
        name="InvisibleCollisionCapsule"
        position={[0, RUNNER_CONFIG.character.collider.height / 2, 0]}
        material={colliderMaterial}
        visible={false}
      >
        <capsuleGeometry args={[RUNNER_CONFIG.character.collider.radius, RUNNER_CONFIG.character.collider.height - RUNNER_CONFIG.character.collider.radius * 2, 8, 16]} />
      </mesh>

      <group ref={visualRootRef} name="CharacterVisualRoot">
        <RunnerCharacter
          assetPath={RUNNER_CONFIG.character.activeAssetPath}
          runnerStateRef={runnerStateRef}
          actionStateRef={actionStateRef}
          onAssetInfo={onCharacterAssetInfo}
        />
      </group>

      <group name="GroundCheck" position={[0, 0.05, 0]} />
      <group name="CameraTarget" position={[0, 1.25, -0.4]} />
    </group>
  );
}

export function getTrackHeight(z) {
  tmpColor.setHSL(0.31 + Math.sin(z * 0.01) * 0.02, 0.45, 0.45);
  return Math.sin(z * 0.035) * 0.045 + Math.sin(z * 0.011) * 0.035;
}
