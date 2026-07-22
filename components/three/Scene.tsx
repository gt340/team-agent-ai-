"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import TeamOrb from "./TeamOrb";
import AgentNode from "./AgentNode";
import Particles from "./Particles";

const AGENTS = [
  { label: "Support", radius: 3.1, speed: 0.22, offset: 0, tilt: 0.6, color: "#3DD9EB" },
  { label: "Docs", radius: 3.6, speed: 0.16, offset: 1.4, tilt: 0.9, color: "#FA5D19" },
  { label: "Code", radius: 2.7, speed: 0.28, offset: 2.6, tilt: 0.4, color: "#3DD9EB" },
  { label: "Workflows", radius: 4.0, speed: 0.13, offset: 3.8, tilt: 1.1, color: "#FF8A50" },
  { label: "Analytics", radius: 3.3, speed: 0.2, offset: 5.0, tilt: 0.7, color: "#3DD9EB" },
  { label: "Reporting", radius: 3.85, speed: 0.17, offset: 0.8, tilt: 0.5, color: "#FA5D19" },
];

export default function Scene({
  pointer,
  reduced,
  lowPower,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  reduced: boolean;
  lowPower: boolean;
}) {
  const { camera } = useThree();
  const camTarget = useRef(new THREE.Vector3(0, 0, 8));

  useFrame(() => {
    if (reduced) return;
    camTarget.current.set(pointer.current.x * 0.7, pointer.current.y * 0.4 + 0.2, 8);
    camera.position.lerp(camTarget.current, 0.04);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <group scale={lowPower ? 0.6 : 1} position={[0, 1.6, 0]}>
        <TeamOrb pointer={pointer} />
      {AGENTS.map((a) => (
        <AgentNode key={a.label} {...a} />
      ))}
      </group>
      {!lowPower && <Particles count={reduced ? 300 : 900} />}

      {!lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <DepthOfField focusDistance={0.01} focalLength={0.02} bokehScale={2.4} />
          <Vignette eskil={false} offset={0.15} darkness={0.9} />
        </EffectComposer>
      )}
    </>
  );
}
