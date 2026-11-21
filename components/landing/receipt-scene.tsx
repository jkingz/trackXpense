"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { animate } from "motion";
import { Component, useEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";

type ReceiptProps = { sampleDay: number; playing: boolean };

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Receipt({ sampleDay, playing }: ReceiptProps) {
  const receipt = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const palette = getComputedStyle(canvas);
  const ink = palette.getPropertyValue("--color-landing-ink").trim();
  const sage = palette.getPropertyValue("--color-landing-sage").trim();
  const paper = palette.getPropertyValue("--color-landing-cream").trim();

  useEffect(() => {
    const group = receipt.current;
    if (!playing || !group) return;

    const animation = animate(group.rotation.y, (sampleDay - 3) * 0.24, {
      type: "spring",
      visualDuration: 0.46,
      bounce: 0.16,
      onUpdate: (rotation) => {
        group.rotation.y = rotation;
        invalidate();
      },
    });
    return () => animation.stop();
  }, [invalidate, playing, sampleDay]);

  return (
    <group ref={receipt} rotation={[0.2, 0.48, -0.24]}>
      <RoundedBox args={[1.61, 1.94, 0.16]} radius={0.08} position={[0.2, -0.16, -0.24]}>
        <meshStandardMaterial color={sage} roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[1.52, 2.06, 0.13]} radius={0.06}>
        <meshStandardMaterial color={paper} roughness={0.85} />
      </RoundedBox>
      <mesh position={[-0.28, 0.65, 0.071]}>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial color={sage} />
      </mesh>
      {[0.94, 0.71, 0.84, 0.48].map((width, index) => (
        <mesh key={width} position={[-0.48 + width / 2, 0.24 - index * 0.24, 0.071]}>
          <planeGeometry args={[width, index === 0 ? 0.08 : 0.045]} />
          <meshBasicMaterial color={ink} transparent opacity={index === 0 ? 0.88 : 0.35} />
        </mesh>
      ))}
    </group>
  );
}

export default function ReceiptScene(props: ReceiptProps) {
  return (
    <div
      data-landing-receipt-scene
      className="pointer-events-none absolute -top-6 -right-3 size-38 sm:-top-4 sm:right-0 sm:size-58"
    >
      <SceneBoundary>
        <Canvas camera={{ position: [0, 0, 5], fov: 32 }} dpr={[1, 1.5]} frameloop="demand">
          <ambientLight intensity={1.45} />
          <directionalLight position={[3, 4, 5]} intensity={1.55} />
          <Receipt {...props} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
