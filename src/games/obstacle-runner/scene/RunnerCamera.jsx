import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { RUNNER_CONFIG } from "./runnerConfig";

export default function RunnerCamera({ runnerStateRef }) {
  const { camera } = useThree();
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const state = runnerStateRef.current;
    const safeDelta = Math.min(delta, 0.05);
    const laneOffset = state.x * RUNNER_CONFIG.camera.laneResponseStrength;

    desiredPosition.set(
      laneOffset,
      RUNNER_CONFIG.camera.height,
      state.z + RUNNER_CONFIG.camera.followDistance
    );
    camera.position.lerp(desiredPosition, 1 - Math.exp(-RUNNER_CONFIG.camera.followSmoothing * safeDelta));

    lookTarget.set(
      state.x * 0.28,
      1.15,
      state.z - RUNNER_CONFIG.camera.lookAheadDistance
    );
    camera.lookAt(lookTarget);
  });

  return null;
}
