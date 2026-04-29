import React, { useRef, useState } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { MannequinState } from './catalog';

// ---------------------------------------------------------------------------
// Capsule helper — Three.js r152+ has CapsuleGeometry built-in.
// args: [radius, length (cylinder part), capSegments, radialSegments]
// The capsule's total height = length + 2 * radius, centered at Y=0.
// ---------------------------------------------------------------------------
function Capsule({
  radius,
  length,
  position,
  rotation,
  mat,
}: {
  radius: number;
  length: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  mat: React.ReactElement;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <capsuleGeometry args={[radius, length, 8, 16]} />
      {mat}
    </mesh>
  );
}

interface MannequinGeometryProps {
  color: string;
  selected: boolean;
}

// ---------------------------------------------------------------------------
// Human figure built from capsules — no visible gaps between segments.
// Total height ≈ 1.80 m, feet at Y = 0.
// ---------------------------------------------------------------------------
function MannequinGeometry({ color, selected }: MannequinGeometryProps) {
  const emissive = selected ? '#00ffff' : '#000000';
  const ei = selected ? 0.3 : 0;
  const mat = <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} roughness={0.6} metalness={0.1} />;

  return (
    <group>
      {/* ── Head ── */}
      <mesh position={[0, 1.70, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        {mat}
      </mesh>
      {/* Direction dot */}
      <mesh position={[0, 1.70, 0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>

      {/* ── Neck ── */}
      <Capsule radius={0.045} length={0.08} position={[0, 1.565, 0]} mat={mat} />

      {/* ── Torso (one capsule, shoulder to hip) ── */}
      <Capsule radius={0.145} length={0.38} position={[0, 1.22, 0]} mat={mat} />

      {/* ── Pelvis bridge (fills gap between torso and legs) ── */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        {mat}
      </mesh>

      {/* ── Right arm ── */}
      <Capsule radius={0.052} length={0.22} position={[0.21, 1.26, 0]} rotation={[0, 0, -0.26]} mat={mat} />
      <mesh position={[0.30, 1.02, 0]}>
        <sphereGeometry args={[0.052, 12, 12]} />
        {mat}
      </mesh>
      <Capsule radius={0.042} length={0.20} position={[0.30, 0.84, 0]} mat={mat} />
      {/* right hand — single cylinder */}
      <mesh position={[0.30, 0.63, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.10, 10]} />
        {mat}
      </mesh>

      {/* ── Left arm ── */}
      <Capsule radius={0.052} length={0.22} position={[-0.21, 1.26, 0]} rotation={[0, 0, 0.26]} mat={mat} />
      <mesh position={[-0.30, 1.02, 0]}>
        <sphereGeometry args={[0.052, 12, 12]} />
        {mat}
      </mesh>
      <Capsule radius={0.042} length={0.20} position={[-0.30, 0.84, 0]} mat={mat} />
      {/* left hand — single cylinder */}
      <mesh position={[-0.30, 0.63, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.10, 10]} />
        {mat}
      </mesh>

      {/* ── Legs — single thick cylinder (both legs merged) ── */}
      {/* spans y=[0.12, 0.92], overlaps pelvis bridge sphere at top */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.80, 16]} />
        {mat}
      </mesh>

      {/* ── Chess piece base ── */}
      {/* taper: connects leg cylinder bottom (y≈0.12) down to wide plate */}
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.11, 0.17, 0.07, 20]} />
        {mat}
      </mesh>
      {/* wide base plate: bottom at y=0 (ground level) */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.17, 0.22, 0.06, 24]} />
        {mat}
      </mesh>
    </group>
  );
}

interface MannequinControllerProps {
  mannequin: MannequinState;
  sceneScale: number;
  selected: boolean;
  onSelect: () => void;
  onTransformEnd: (position: [number, number, number], rotation: [number, number, number]) => void;
  orbitRef: React.RefObject<OrbitControlsImpl>;
}

export function MannequinController({
  mannequin,
  sceneScale,
  selected,
  onSelect,
  onTransformEnd,
}: MannequinControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [mode, setMode] = useState<'translate' | 'rotate'>('translate');

  function handleMouseUp() {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    const r = groupRef.current.rotation;
    onTransformEnd([p.x, p.y, p.z], [r.x, r.y, r.z]);
  }

  // Combined scale: per-mannequin scale × scene scale
  const totalScale = mannequin.scale * sceneScale;

  return (
    <group>
      {selected && (
        <TransformControls
          object={groupRef as any}
          mode={mode}
          onMouseUp={handleMouseUp}
        />
      )}
      <group
        ref={groupRef}
        position={mannequin.position}
        rotation={mannequin.rotation}
        scale={totalScale}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <MannequinGeometry color={mannequin.color} selected={selected} />
        {selected && (
          <mesh
            position={[0, 2.05, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setMode((m) => (m === 'translate' ? 'rotate' : 'translate'));
            }}
          >
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color={mode === 'translate' ? '#00ff88' : '#ff8800'}
              emissive={mode === 'translate' ? '#00ff88' : '#ff8800'}
              emissiveIntensity={0.8}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
