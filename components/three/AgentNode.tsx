"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  radius: number;
  speed: number;
  offset: number;
  tilt: number;
  label: string;
  color?: string;
};

export default function AgentNode({ radius, speed, offset, tilt, label, color = "#3DD9EB" }: Props) {
  const nodeRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.BufferGeometry>(null);
  const pos = useRef(new THREE.Vector3());

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + offset;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 1.3 + offset) * tilt;
    pos.current.set(x, y, z);

    if (nodeRef.current) {
      nodeRef.current.position.copy(pos.current);
    }
    if (lineRef.current) {
      const arr = lineRef.current.attributes.position.array as Float32Array;
      arr[0] = 0;
      arr[1] = 0;
      arr[2] = 0;
      arr[3] = x;
      arr[4] = y;
      arr[5] = z;
      lineRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <line>
        <primitive object={lineGeometry} ref={lineRef} attach="geometry" />
        <lineBasicMaterial color={color} transparent opacity={0.28} />
      </line>
      <mesh ref={nodeRef}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
        <Html distanceFactor={9} occlude={false} zIndexRange={[10, 0]}>
          <div className="hidden sm:block pointer-events-none select-none whitespace-nowrap rounded-full border border-white/10 bg-base-900/80 px-2.5 py-1 font-mono text-[10px] tracking-wide text-ink/80 backdrop-blur-sm">
            {label}
          </div>
        </Html>
      </mesh>
    </group>
  );
}
