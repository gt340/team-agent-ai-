"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Icosahedron } from "@react-three/drei";
import * as THREE from "three";

export default function TeamOrb({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const core = useRef<THREE.Mesh>(null);
  const wireOuter = useRef<THREE.Mesh>(null);
  const wireInner = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (wireOuter.current) {
      wireOuter.current.rotation.y += delta * 0.12;
      wireOuter.current.rotation.x += delta * 0.04;
    }
    if (wireInner.current) {
      wireInner.current.rotation.y -= delta * 0.18;
      wireInner.current.rotation.z += delta * 0.06;
    }
    if (core.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.03;
      core.current.scale.setScalar(s);
    }
    if (group.current) {
      // gentle parallax toward pointer
      group.current.rotation.y += (pointer.current.x * 0.3 - group.current.rotation.y) * 0.03;
      group.current.rotation.x += (-pointer.current.y * 0.2 - group.current.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={group}>
      {/* Glowing core */}
      <Icosahedron ref={core} args={[1.15, 6]}>
        <MeshDistortMaterial
          color="#FA5D19"
          emissive="#FA5D19"
          emissiveIntensity={1.4}
          distort={0.35}
          speed={1.6}
          roughness={0.15}
          metalness={0.4}
        />
      </Icosahedron>

      {/* Outer wireframe shell */}
      <Icosahedron ref={wireOuter} args={[1.7, 1]}>
        <meshBasicMaterial color="#3DD9EB" wireframe transparent opacity={0.35} />
      </Icosahedron>

      {/* Inner rotating shell */}
      <Icosahedron ref={wireInner} args={[1.42, 0]}>
        <meshBasicMaterial color="#FF8A50" wireframe transparent opacity={0.25} />
      </Icosahedron>

      <pointLight color="#FA5D19" intensity={8} distance={6} />
      <pointLight color="#3DD9EB" intensity={4} distance={8} position={[2, 1, 2]} />
    </group>
  );
}
