import React, { useRef, useState } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { PropState } from './catalog';

interface PropGeometryProps {
  propId: string;
  color: string;
  selected: boolean;
}

export function PropGeometry({ propId, color, selected }: PropGeometryProps) {
  const emissive = selected ? '#00ffff' : '#000000';
  const emissiveIntensity = selected ? 0.35 : 0;
  const mat = (c = color) => (
    <meshStandardMaterial color={c} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.7} metalness={0.1} />
  );

  switch (propId) {
    // ── 室内家具 ──────────────────────────────────────────────────
    case 'sofa':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[2.2, 0.5, 1]} />{mat()}</mesh>
          <mesh position={[0, 0.7, -0.4]}><boxGeometry args={[2.2, 0.8, 0.2]} />{mat()}</mesh>
          <mesh position={[1, 0.6, 0]}><boxGeometry args={[0.2, 0.6, 1]} />{mat()}</mesh>
          <mesh position={[-1, 0.6, 0]}><boxGeometry args={[0.2, 0.6, 1]} />{mat()}</mesh>
        </group>
      );
    case 'chair':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.9, 0.1, 0.9]} />{mat()}</mesh>
          <mesh position={[0, 1.1, -0.4]}><boxGeometry args={[0.9, 1.0, 0.1]} />{mat()}</mesh>
          {[[-0.4, 0.25, 0.4], [0.4, 0.25, 0.4], [-0.4, 0.25, -0.4], [0.4, 0.25, -0.4]].map((p, i) => (
            <mesh key={i} position={p as any}><cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />{mat()}</mesh>
          ))}
        </group>
      );
    case 'desk':
      return (
        <group>
          <mesh position={[0, 0.75, 0]}><boxGeometry args={[2, 0.08, 1]} />{mat()}</mesh>
          {[[-0.9, 0.35, 0.4], [0.9, 0.35, 0.4], [-0.9, 0.35, -0.4], [0.9, 0.35, -0.4]].map((p, i) => (
            <mesh key={i} position={p as any}><boxGeometry args={[0.07, 0.7, 0.07]} />{mat()}</mesh>
          ))}
        </group>
      );
    case 'bed':
      return (
        <group>
          <mesh position={[0, 0.2, 0]}><boxGeometry args={[2, 0.4, 3]} />{mat()}</mesh>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.9, 0.3, 2.9]} />{mat('#f5f5dc')}</mesh>
          <mesh position={[0, 0.7, -1.4]}><boxGeometry args={[2, 0.6, 0.15]} />{mat()}</mesh>
        </group>
      );
    case 'cabinet':
      return (
        <group>
          <mesh position={[0, 0.9, 0]}><boxGeometry args={[1.2, 1.8, 0.5]} />{mat()}</mesh>
          <mesh position={[0.28, 1.1, 0.26]}><sphereGeometry args={[0.05, 8, 8]} />{mat('#FFD700')}</mesh>
          <mesh position={[0.28, 0.7, 0.26]}><sphereGeometry args={[0.05, 8, 8]} />{mat('#FFD700')}</mesh>
        </group>
      );
    case 'shelf':
      return (
        <group>
          {[0.2, 0.8, 1.4, 2.0].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}><boxGeometry args={[1.5, 0.05, 0.4]} />{mat()}</mesh>
          ))}
          <mesh position={[-0.73, 1.1, 0]}><boxGeometry args={[0.05, 2.2, 0.4]} />{mat()}</mesh>
          <mesh position={[0.73, 1.1, 0]}><boxGeometry args={[0.05, 2.2, 0.4]} />{mat()}</mesh>
        </group>
      );

    // ── 室外道具 ──────────────────────────────────────────────────
    case 'house':
      return (
        <group>
          <mesh position={[0, 1, 0]}><boxGeometry args={[3, 2, 3]} />{mat()}</mesh>
          <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[2.3, 1.2, 4]} />{mat('#8B0000')}
          </mesh>
        </group>
      );
    case 'tree':
      return (
        <group>
          <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />{mat('#8B4513')}</mesh>
          <mesh position={[0, 2.2, 0]}><sphereGeometry args={[1.2, 12, 12]} />{mat('#228B22')}</mesh>
        </group>
      );
    case 'car':
      return (
        <group>
          <mesh position={[0, 0.35, 0]}><boxGeometry args={[3.5, 0.7, 1.6]} />{mat()}</mesh>
          <mesh position={[0, 0.9, 0]}><boxGeometry args={[2.2, 0.7, 1.5]} />{mat()}</mesh>
          {[[-1.2, 0, 0.8], [1.2, 0, 0.8], [-1.2, 0, -0.8], [1.2, 0, -0.8]].map((p, i) => (
            <mesh key={i} position={p as any} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.25, 12]} />{mat('#222')}
            </mesh>
          ))}
        </group>
      );
    case 'bench':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[2, 0.1, 0.5]} />{mat()}</mesh>
          {[[-0.8, 0.25, 0], [0.8, 0.25, 0]].map((p, i) => (
            <mesh key={i} position={p as any}><boxGeometry args={[0.1, 0.5, 0.5]} />{mat()}</mesh>
          ))}
        </group>
      );
    case 'rock':
      return (
        <mesh><dodecahedronGeometry args={[0.7, 0]} />{mat('#808080')}</mesh>
      );
    case 'fence':
      return (
        <group>
          {[-1.5, -0.75, 0, 0.75, 1.5].map((x, i) => (
            <mesh key={i} position={[x, 0.6, 0]}><boxGeometry args={[0.1, 1.2, 0.1]} />{mat()}</mesh>
          ))}
          <mesh position={[0, 0.9, 0]}><boxGeometry args={[3.2, 0.08, 0.08]} />{mat()}</mesh>
          <mesh position={[0, 0.4, 0]}><boxGeometry args={[3.2, 0.08, 0.08]} />{mat()}</mesh>
        </group>
      );
    case 'lamp': case 'streetlight':
      return (
        <group>
          <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.06, 0.1, 4, 8]} />{mat('#555')}</mesh>
          <mesh position={[0.5, 3.9, 0]} rotation={[0, 0, Math.PI / 4]}><cylinderGeometry args={[0.04, 0.04, 1, 8]} />{mat('#555')}</mesh>
          <mesh position={[0.9, 4.1, 0]}><sphereGeometry args={[0.2, 8, 8]} />{mat('#FFFFE0')}</mesh>
        </group>
      );

    // ── 古风道具 ──────────────────────────────────────────────────
    case 'sword':
      return (
        <group rotation={[0, 0, Math.PI / 6]}>
          <mesh position={[0, 1, 0]}><boxGeometry args={[0.08, 2, 0.02]} />{mat('#C0C0C0')}</mesh>
          <mesh position={[0, -0.05, 0]}><boxGeometry args={[0.4, 0.1, 0.08]} />{mat('#DAA520')}</mesh>
          <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.05, 0.04, 0.7, 8]} />{mat('#8B4513')}</mesh>
        </group>
      );
    case 'lantern':
      return (
        <group>
          <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.5, 12, 8]} />{mat('#DC143C')}</mesh>
          <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />{mat('#DAA520')}</mesh>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.06, 0.06, 0.15, 8]} />{mat('#DAA520')}</mesh>
        </group>
      );
    case 'vase':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.3, 0.2, 1.0, 12]} />{mat()}</mesh>
          <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.15, 0.3, 0.15, 12]} />{mat()}</mesh>
        </group>
      );
    case 'screen':
      return (
        <group>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[2.5, 2, 0.05]} />{mat()}</mesh>
          {[-1.2, 1.2].map((x, i) => (
            <mesh key={i} position={[x, 1, 0]}><cylinderGeometry args={[0.06, 0.06, 2.2, 8]} />{mat('#DAA520')}</mesh>
          ))}
        </group>
      );
    case 'winepot': case 'guqin': case 'ancientbed': case 'teatable':
      return (
        <group>
          <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.3, 0.25, 0.8, 10]} />{mat()}</mesh>
          <mesh position={[0, 0.85, 0]}><sphereGeometry args={[0.2, 8, 8]} />{mat()}</mesh>
        </group>
      );

    // ── 现代道具 ──────────────────────────────────────────────────
    case 'door':
      return (
        <group>
          <mesh position={[0, 1.1, 0]}><boxGeometry args={[1, 2.2, 0.1]} />{mat()}</mesh>
          <mesh position={[0.35, 1.1, 0.06]}><sphereGeometry args={[0.06, 8, 8]} />{mat('#DAA520')}</mesh>
        </group>
      );
    case 'skyscraper':
      return (
        <group>
          <mesh position={[0, 4, 0]}><boxGeometry args={[2, 8, 2]} />{mat('#708090')}</mesh>
          {[1, 2, 3, 4, 5, 6, 7].map((y) => (
            <mesh key={y} position={[0, y, 1.01]}><boxGeometry args={[1.6, 0.3, 0.02]} />{mat('#87CEEB')}</mesh>
          ))}
        </group>
      );
    case 'shopfront':
      return (
        <group>
          <mesh position={[0, 1.25, 0]}><boxGeometry args={[3, 2.5, 1.5]} />{mat()}</mesh>
          <mesh position={[0, 2.7, 0]}><boxGeometry args={[3.2, 0.4, 1.7]} />{mat('#8B0000')}</mesh>
          <mesh position={[0, 1.1, 0.76]}><boxGeometry args={[2, 1.8, 0.05]} />{mat('#87CEEB')}</mesh>
        </group>
      );
    case 'hydrant':
      return (
        <group>
          <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.2, 0.25, 0.9, 10]} />{mat('#DC143C')}</mesh>
          <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.15, 0.15, 0.2, 10]} />{mat('#DC143C')}</mesh>
          <mesh position={[0.28, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />{mat('#888')}
          </mesh>
        </group>
      );
    case 'trashcan': case 'streetlight2':
      return (
        <group>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.3, 0.25, 1, 10]} />{mat('#696969')}</mesh>
          <mesh position={[0, 1.02, 0]}><cylinderGeometry args={[0.32, 0.32, 0.06, 10]} />{mat('#555')}</mesh>
        </group>
      );

    // ── 装饰 ──────────────────────────────────────────────────────
    case 'longlantern':
      return (
        <group>
          <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.25, 0.25, 2, 10]} />{mat('#DC143C')}</mesh>
          <mesh position={[0, 2.05, 0]}><cylinderGeometry args={[0.12, 0.12, 0.15, 8]} />{mat('#DAA520')}</mesh>
        </group>
      );
    case 'cauldron':
      return (
        <group>
          <mesh position={[0, 0.6, 0]}><sphereGeometry args={[0.7, 12, 12]} />{mat('#8B8000')}</mesh>
          {[[-0.7, 0.1, 0], [0.7, 0.1, 0]].map((p, i) => (
            <mesh key={i} position={p as any}><cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />{mat('#555')}</mesh>
          ))}
        </group>
      );
    case 'inkstone':
      return <mesh position={[0, 0.07, 0]}><boxGeometry args={[0.8, 0.14, 0.5]} />{mat('#2F4F4F')}</mesh>;
    case 'hourglass':
      return (
        <group>
          <mesh position={[0, 0.4, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.3, 0.8, 10]} />{mat('#DAA520')}</mesh>
          <mesh position={[0, 0.4, 0]}><coneGeometry args={[0.3, 0.8, 10]} />{mat('#DAA520')}</mesh>
        </group>
      );
    case 'incense':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.3, 0.35, 0.6, 10]} />{mat('#CD853F')}</mesh>
          <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.28, 0.28, 0.1, 10]} />{mat('#B8860B')}</mesh>
        </group>
      );

    // ── 几何模型 ──────────────────────────────────────────────────
    case 'cube':
      return <mesh position={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} />{mat()}</mesh>;
    case 'sphere':
      return <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.7, 16, 16]} />{mat()}</mesh>;
    case 'cylinder':
      return <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.5, 0.5, 1.5, 16]} />{mat()}</mesh>;
    case 'cone':
      return <mesh position={[0, 0.75, 0]}><coneGeometry args={[0.6, 1.5, 12]} />{mat()}</mesh>;
    case 'torus':
      return <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.5, 0.2, 12, 24]} />{mat()}</mesh>;
    case 'plane':
      return <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2, 2]} />{mat()}</mesh>;

    default:
      return <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.8, 0.8, 0.8]} />{mat()}</mesh>;
  }
}

interface PropControllerProps {
  prop: PropState;
  sceneScale: number;
  selected: boolean;
  onSelect: () => void;
  onTransformEnd: (position: [number, number, number], rotation: [number, number, number]) => void;
  orbitRef: React.RefObject<OrbitControlsImpl>;
}

export function PropController({
  prop,
  sceneScale,
  selected,
  onSelect,
  onTransformEnd,
}: PropControllerProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [mode, setMode] = useState<'translate' | 'rotate'>('translate');

  function handleMouseUp() {
    if (!meshRef.current) return;
    const p = meshRef.current.position;
    const r = meshRef.current.rotation;
    onTransformEnd([p.x, p.y, p.z], [r.x, r.y, r.z]);
  }

  const totalScale = prop.scale * sceneScale;

  return (
    <group>
      {selected && (
        <TransformControls
          object={meshRef as any}
          mode={mode}
          onMouseUp={handleMouseUp}
        />
      )}
      <group
        ref={meshRef}
        position={prop.position}
        rotation={prop.rotation}
        scale={totalScale}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <PropGeometry propId={prop.propId} color={prop.color} selected={selected} />
        {selected && (
          <mesh
            position={[0, 2.8, 0]}
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
