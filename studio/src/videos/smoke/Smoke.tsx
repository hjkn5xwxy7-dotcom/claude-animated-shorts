// Minimal WebGL smoke test: a lit, rotating box. Used by CI to check that headless WebGL renders at all.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";

export const Smoke: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#203040" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 0, 6] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <mesh rotation={[0.4, f * 0.05, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#e2453c" />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
