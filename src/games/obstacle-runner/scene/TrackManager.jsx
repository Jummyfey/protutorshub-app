import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import TrackSegment from "./TrackSegment";
import { RUNNER_CONFIG, TRACK_VARIANTS } from "./runnerConfig";

export default function TrackManager({ runnerStateRef }) {
  const segmentRefs = useRef([]);
  const segmentMetadataRef = useRef([]);
  const pool = useMemo(() => Array.from({ length: RUNNER_CONFIG.track.activeSegments }, (_, poolIndex) => ({
    poolIndex,
    variant: TRACK_VARIANTS[poolIndex % TRACK_VARIANTS.length],
  })), []);

  useFrame(() => {
    const state = runnerStateRef.current;
    const segmentLength = RUNNER_CONFIG.track.segmentLength;
    const firstIndex = Math.max(0, Math.floor((state.distance - RUNNER_CONFIG.track.recycleBehindDistance) / segmentLength));

    segmentRefs.current.forEach((group, poolIndex) => {
      if (!group) return;
      const worldIndex = firstIndex + poolIndex;
      const z = -worldIndex * segmentLength - segmentLength / 2;
      group.position.z = z;
      group.userData.segmentIndex = worldIndex;
      group.userData.segmentType = TRACK_VARIANTS[worldIndex % TRACK_VARIANTS.length];
      const debugGroup = group.getObjectByName("debug-segment");
      if (debugGroup) debugGroup.visible = Boolean(state.debug);
      segmentMetadataRef.current[poolIndex] = {
        segmentIndex: worldIndex,
        type: group.userData.segmentType,
        safeRunningSection: true,
        questionZone: null,
        answerApproachZone: null,
        answerGatePosition: null,
        consequenceZone: null,
      };
    });
  });

  return (
    <group>
      {pool.map((segment) => (
        <TrackSegment
          key={segment.poolIndex}
          ref={(node) => {
            segmentRefs.current[segment.poolIndex] = node;
          }}
          poolIndex={segment.poolIndex}
          variant={segment.variant}
        />
      ))}
    </group>
  );
}
