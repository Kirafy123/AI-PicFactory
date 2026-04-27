import React, { useRef, useState } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { MannequinState } from './catalog';

interface MannequinGeometryProps {
  color: string;
  pose: string;
  selected: boolean;
}

function MannequinGeometry({ color, pose, selected }: MannequinGeometryProps) {
  const emissive = selected ? '#00ffff' : '#000000';
  const emissiveIntensity = selected ? 0.3 : 0;
  const mat = (c = color) => (
    <meshStandardMaterial color={c} emissive={emissive} emissiveIntensity={emissiveIntensity} />
  );

  const isLieFlat = pose === 'lieflat';
  const isLean45 = pose === 'lean45';
  const isSit = pose === 'sitchair';

  const groupRotation: [number, number, number] = isLieFlat
    ? [Math.PI / 2, 0, 0]
    : isLean45
    ? [0, 0, -Math.PI / 4]
    : [0, 0, 0];

  const upperLegAngle = isSit ? Math.PI / 2 : 0;
  const lowerLegAngle = isSit ? -Math.PI / 2 : 0;

  return (
    <group rotation={groupRotation}>
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0.13, 2.22, 0.33]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.13, 2.22, 0.33]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <capsuleGeometry args={[0.32, 1.2, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.28, 0.35, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0.55, 1.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <capsuleGeometry args={[0.12, 0.7, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0.75, 0.95, 0]} rotation={[0, 0, Math.PI / 8]}>
        <capsuleGeometry args={[0.1, 0.65, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[-0.55, 1.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <capsuleGeometry args={[0.12, 0.7, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[-0.75, 0.95, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <capsuleGeometry args={[0.1, 0.65, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0.22, isSit ? 0.15 : -0.1, isSit ? 0.35 : 0]} rotation={[upperLegAngle, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.75, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0.22, isSit ? 0.15 : -0.8, isSit ? 0.9 : 0]} rotation={[lowerLegAngle, 0, 0]}>
        <capsuleGeometry args={[0.13, 0.75, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[-0.22, isSit ? 0.15 : -0.1, isSit ? 0.35 : 0]} rotation={[upperLegAngle, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.75, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[-0.22, isSit ? 0.15 : -0.8, isSit ? 0.9 : 0]} rotation={[lowerLegAngle, 0, 0]}>
        <capsuleGeometry args={[0.13, 0.75, 8, 16]} />
        {mat()}
      </mesh>
      <mesh position={[0.22, isSit ? 0.15 : -1.35, isSit ? 1.2 : 0.1]}>
        <boxGeometry args={[0.2, 0.12, 0.35]} />
        {mat()}
      </mesh>
      <mesh position={[-0.22, isSit ? 0.15 : -1.35, isSit ? 1.2 : 0.1]}>
        <boxGeometry args={[0.2, 0.12, 0.35]} />
        {mat()}
      </mesh>
    </group>
  );
}

interface MannequinControllerProps {
  mannequin: MannequinState;
  selected: boolean;
  onSelect: () => void;
  onTransformEnd: (position: [number, number, number], rotation: [number, number, number]) => void;
  orbitRef: React.RefObject<OrbitControlsImpl>;
}

export function MannequinController({
  mannequin,
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
        scale={mannequin.scale}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <MannequinGeometry color={mannequin.color} pose={mannequin.pose} selected={selected} />
        {selected && (
          <mesh
            position={[0, 2.9, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setMode((m) => (m === 'translate' ? 'rotate' : 'translate'));
            }}
          >
            <sphereGeometry args={[0.18, 8, 8]} />
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
