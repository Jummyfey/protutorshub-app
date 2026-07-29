import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { RUNNER_CONFIG, TRACK_VARIANTS } from "./runnerConfig";

const segmentColors = {
  "straight-dirt": ["#b97836", "#d49649", "#6db74e"],
  "jungle-path": ["#98622f", "#c98238", "#357d36"],
  "riverside-path": ["#c69254", "#ddb36e", "#4ba755"],
  "rocky-path": ["#9b7148", "#bf8952", "#6c8f4a"],
  "open-grassland": ["#c5863f", "#dda25a", "#7cc957"],
};

const TrackSegment = forwardRef(function TrackSegment({ poolIndex, variant }, ref) {
  const segmentLength = RUNNER_CONFIG.track.segmentLength;
  const roadWidth = RUNNER_CONFIG.track.roadWidth;
  const shoulderWidth = RUNNER_CONFIG.track.shoulderWidth;
  const variantName = TRACK_VARIANTS[poolIndex % TRACK_VARIANTS.length] || variant;
  const [dirtA, dirtB, grass] = segmentColors[variantName] || segmentColors["straight-dirt"];

  const materials = useMemo(() => ({
    dirt: new THREE.MeshStandardMaterial({
      color: dirtA,
      roughness: 0.92,
      metalness: 0.02,
      aoMapIntensity: 0.35,
      normalScale: new THREE.Vector2(0.32, 0.32),
    }),
    dirtPatch: new THREE.MeshStandardMaterial({ color: dirtB, roughness: 0.96 }),
    grass: new THREE.MeshStandardMaterial({ color: grass, roughness: 0.85 }),
    darkGrass: new THREE.MeshStandardMaterial({ color: "#2f7d32", roughness: 0.88 }),
    wood: new THREE.MeshStandardMaterial({ color: "#875126", roughness: 0.78 }),
    rock: new THREE.MeshStandardMaterial({ color: "#7c8178", roughness: 0.9 }),
    water: new THREE.MeshStandardMaterial({ color: "#38bdf8", roughness: 0.28, metalness: 0.05, transparent: true, opacity: 0.78 }),
    debug: new THREE.MeshBasicMaterial({ color: "#facc15", transparent: true, opacity: 0.28 }),
  }), [dirtA, dirtB, grass]);

  const decorations = useMemo(() => {
    const items = [];
    for (let i = 0; i < 14; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -segmentLength / 2 + 4 + i * 2.7;
      const x = side * (roadWidth / 2 + 1.4 + ((poolIndex * 13 + i * 7) % 24) / 10);
      items.push({ id: `grass-${i}`, type: "grass", x, z, scale: 0.7 + ((i + poolIndex) % 4) * 0.12 });
    }
    for (let i = 0; i < 5; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      items.push({
        id: `tree-${i}`,
        type: "tree",
        x: side * (roadWidth / 2 + 4.5 + ((poolIndex + i) % 3)),
        z: -segmentLength / 2 + 7 + i * 7.3,
        scale: 0.75 + ((poolIndex + i) % 3) * 0.18,
      });
    }
    return items;
  }, [poolIndex, roadWidth, segmentLength]);

  return (
    <group ref={ref} userData={{ segmentType: variantName }}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[roadWidth + shoulderWidth * 2, segmentLength, 18, 18]} />
        <primitive object={materials.grass} attach="material" />
      </mesh>

      <mesh position={[0, 0.018, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[roadWidth, segmentLength, 18, 18]} />
        <primitive object={materials.dirt} attach="material" />
      </mesh>

      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[0.2, segmentLength]} />
          <primitive object={materials.darkGrass} attach="material" />
        </mesh>
      ))}

      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`patch-${i}`} position={[((i * 1.7 + poolIndex) % 7) - 3.5, 0.052, -segmentLength / 2 + 3 + i * 4.3]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.25 + (i % 3) * 0.09, 9]} />
          <primitive object={i % 2 ? materials.dirtPatch : materials.rock} attach="material" />
        </mesh>
      ))}

      {variantName === "riverside-path" ? (
        <mesh position={[roadWidth / 2 + 3.2, 0.035, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.2, segmentLength]} />
          <primitive object={materials.water} attach="material" />
        </mesh>
      ) : null}

      {variantName === "jungle-path" || variantName === "forest-tunnel" ? (
        [-1, 1].map((side) => (
          <group key={side} position={[side * (roadWidth / 2 + 0.7), 0.18, 0]}>
            {Array.from({ length: 5 }, (_, i) => (
              <mesh key={i} position={[0, 0, -segmentLength / 2 + 5 + i * 8]} rotation-z={side * 0.2} castShadow>
                <boxGeometry args={[0.16, 0.36, 2.2]} />
                <primitive object={materials.wood} attach="material" />
              </mesh>
            ))}
          </group>
        ))
      ) : null}

      {decorations.map((item) => item.type === "tree" ? (
        <group key={item.id} position={[item.x, 0, item.z]} scale={item.scale} castShadow>
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.3, 7]} />
            <primitive object={materials.wood} attach="material" />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <coneGeometry args={[0.72, 1.35, 8]} />
            <primitive object={materials.darkGrass} attach="material" />
          </mesh>
        </group>
      ) : (
        <mesh key={item.id} position={[item.x, 0.16, item.z]} scale={item.scale} castShadow>
          <coneGeometry args={[0.18, 0.34, 5]} />
          <primitive object={materials.darkGrass} attach="material" />
        </mesh>
      ))}

      <group name="future-learning-anchors" visible={false}>
        {RUNNER_CONFIG.lanes.map((x, index) => (
          <group key={x} name={["left-answer-lane", "centre-answer-lane", "right-answer-lane"][index]} position={[x, 0.05, -segmentLength * 0.12]} />
        ))}
        <group name="obstacle-anchors" position={[0, 0.05, -segmentLength * 0.28]} />
        <group name="reward-anchors" position={[0, 0.05, segmentLength * 0.18]} />
        <group name="answer-gate-anchors" position={[0, 0.05, -segmentLength * 0.38]} />
      </group>

      <group name="debug-segment" visible={false}>
        <mesh position={[0, 0.09, -segmentLength / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[roadWidth + shoulderWidth * 2, 0.18]} />
          <primitive object={materials.debug} attach="material" />
        </mesh>
        <mesh position={[0, 0.09, segmentLength / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[roadWidth + shoulderWidth * 2, 0.18]} />
          <primitive object={materials.debug} attach="material" />
        </mesh>
        {RUNNER_CONFIG.lanes.map((x) => (
          <mesh key={`debug-lane-${x}`} position={[x, 0.095, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.08, segmentLength]} />
            <primitive object={materials.debug} attach="material" />
          </mesh>
        ))}
        {RUNNER_CONFIG.lanes.map((x) => (
          <mesh key={`debug-answer-${x}`} position={[x, 0.28, -segmentLength * 0.38]}>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <primitive object={materials.debug} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 0.32, -segmentLength * 0.28]}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
          <primitive object={materials.debug} attach="material" />
        </mesh>
      </group>
    </group>
  );
});

export default TrackSegment;
