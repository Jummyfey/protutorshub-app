import { useMemo } from "react";
import * as THREE from "three";

export default function EnvironmentManager() {
  const materials = useMemo(() => ({
    hill: new THREE.MeshStandardMaterial({ color: "#5da85d", roughness: 0.9 }),
    hillDark: new THREE.MeshStandardMaterial({ color: "#3d7f46", roughness: 0.92 }),
    cloud: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7 }),
    flowerA: new THREE.MeshStandardMaterial({ color: "#f472b6", roughness: 0.6 }),
    flowerB: new THREE.MeshStandardMaterial({ color: "#facc15", roughness: 0.6 }),
  }), []);

  return (
    <group>
      <mesh position={[0, -0.06, -120]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[180, 420]} />
        <meshStandardMaterial color="#59a84e" roughness={0.9} />
      </mesh>

      {[-55, -28, 32, 64].map((x, index) => (
        <mesh key={x} position={[x, 9 + index * 1.2, -150 - index * 18]} scale={[18 + index * 4, 8 + index, 9]} material={index % 2 ? materials.hillDark : materials.hill}>
          <sphereGeometry args={[1, 18, 10]} />
        </mesh>
      ))}

      {[-34, 8, 46].map((x, index) => (
        <group key={x} position={[x, 19 + index * 1.5, -75 - index * 28]}>
          <mesh material={materials.cloud}>
            <sphereGeometry args={[2.4, 12, 8]} />
          </mesh>
          <mesh position={[2.2, 0.2, 0]} material={materials.cloud}>
            <sphereGeometry args={[1.8, 12, 8]} />
          </mesh>
          <mesh position={[-2.1, -0.1, 0]} material={materials.cloud}>
            <sphereGeometry args={[1.6, 12, 8]} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: 36 }, (_, index) => {
        const side = index % 2 ? -1 : 1;
        const z = -8 - index * 7;
        const x = side * (8 + (index % 5) * 2.1);
        return (
          <mesh key={index} position={[x, 0.09, z]} material={index % 2 ? materials.flowerA : materials.flowerB}>
            <sphereGeometry args={[0.09, 6, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}
