import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { MannequinController } from './MannequinMesh';
import { PropController } from './PropMesh';
import type { MannequinState, PropState } from './catalog';

interface PanoramaBackgroundProps {
  url: string;
}

function PanoramaBackground({ url }: PanoramaBackgroundProps) {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [url]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0} />
      </mesh>
      <gridHelper args={[100, 50, '#333333', '#222222']} position={[0, 0, 0]} />
    </group>
  );
}

export type SelectedObject =
  | { kind: 'mannequin'; id: string }
  | { kind: 'prop'; id: string }
  | null;

interface SceneContentProps {
  mannequins: MannequinState[];
  props: PropState[];
  selected: SelectedObject;
  onSelect: (s: SelectedObject) => void;
  onMannequinTransformEnd: (id: string, pos: [number, number, number], rot: [number, number, number]) => void;
  onPropTransformEnd: (id: string, pos: [number, number, number], rot: [number, number, number]) => void;
  panoramaUrl: string | null;
  orbitRef: React.RefObject<OrbitControlsImpl>;
}

function SceneContent({
  mannequins,
  props,
  selected,
  onSelect,
  onMannequinTransformEnd,
  onPropTransformEnd,
  panoramaUrl,
  orbitRef,
}: SceneContentProps) {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      {panoramaUrl && <PanoramaBackground url={panoramaUrl} />}
      {panoramaUrl && <fog attach="fog" args={['#000', 30, 120]} />}
      <Ground />
      {mannequins.map((m) => (
        <MannequinController
          key={m.id}
          mannequin={m}
          selected={selected?.kind === 'mannequin' && selected.id === m.id}
          onSelect={() => onSelect({ kind: 'mannequin', id: m.id })}
          onTransformEnd={(pos, rot) => onMannequinTransformEnd(m.id, pos, rot)}
          orbitRef={orbitRef}
        />
      ))}
      {props.map((p) => (
        <PropController
          key={p.id}
          prop={p}
          selected={selected?.kind === 'prop' && selected.id === p.id}
          onSelect={() => onSelect({ kind: 'prop', id: p.id })}
          onTransformEnd={(pos, rot) => onPropTransformEnd(p.id, pos, rot)}
          orbitRef={orbitRef}
        />
      ))}
    </>
  );
}

interface Director3dSceneProps {
  mannequins: MannequinState[];
  props: PropState[];
  selected: SelectedObject;
  onSelect: (s: SelectedObject) => void;
  onMannequinTransformEnd: (id: string, pos: [number, number, number], rot: [number, number, number]) => void;
  onPropTransformEnd: (id: string, pos: [number, number, number], rot: [number, number, number]) => void;
  panoramaUrl: string | null;
  cameraTarget?: [number, number, number];
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  preserveDrawingBuffer?: boolean;
}

export function Director3dScene({
  mannequins,
  props,
  selected,
  onSelect,
  onMannequinTransformEnd,
  onPropTransformEnd,
  panoramaUrl,
  cameraTarget,
  canvasRef,
  preserveDrawingBuffer = false,
}: Director3dSceneProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null);

  React.useEffect(() => {
    if (!cameraTarget || !orbitRef.current) return;
    const ctrl = orbitRef.current as any;
    if (ctrl.object) {
      ctrl.object.position.set(...cameraTarget);
      ctrl.update();
    }
  }, [cameraTarget]);

  return (
    <Canvas
      ref={canvasRef as any}
      camera={{ position: [0, 1.6, 8], fov: 60 }}
      gl={{ antialias: true, preserveDrawingBuffer, powerPreference: 'high-performance' }}
      style={{ background: '#111' }}
      // onPointerMissed fires only when ray hits nothing in 3D scene,
      // so clicking DOM buttons overlaid on the canvas won't deselect.
      onPointerMissed={() => onSelect(null)}
    >
      <SceneContent
        mannequins={mannequins}
        props={props}
        selected={selected}
        onSelect={onSelect}
        onMannequinTransformEnd={onMannequinTransformEnd}
        onPropTransformEnd={onPropTransformEnd}
        panoramaUrl={panoramaUrl}
        orbitRef={orbitRef}
      />
      {/* makeDefault lets drei's TransformControls automatically disable this
          when a transform drag starts, without needing manual enabled toggling. */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.05}
        maxPolarAngle={Math.PI * 0.7}
        minDistance={2}
        maxDistance={50}
      />
    </Canvas>
  );
}
