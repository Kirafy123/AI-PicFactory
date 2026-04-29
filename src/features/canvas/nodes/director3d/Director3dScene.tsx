import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { MannequinController } from './MannequinMesh';
import { PropController } from './PropMesh';
import type { MannequinState, PropState } from './catalog';

// ── Panorama background ────────────────────────────────────────────────────
function PanoramaBackground({ url }: { url: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.minFilter = THREE.LinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      loaded.needsUpdate = true;
      setTexture(loaded);
    });
    return () => { tex.dispose(); };
  }, [url]);
  if (!texture) return null;
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 60]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} />
    </mesh>
  );
}

// ── Camera initial sync (groundY / panoramaMode only — NOT sceneScale) ─────
function CameraSync({ groundY, panoramaMode }: { groundY: number; panoramaMode: boolean }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    camera.position.set(0, groundY + 1.6, 8);
    if (controls) {
      (controls as any).target.set(0, groundY, 0);
      (controls as any).update();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groundY, panoramaMode]);
  return null;
}

// ── WASD keyboard camera movement ─────────────────────────────────────────
function WASDControls({ enabled, orbitRef }: { enabled: boolean; orbitRef: React.RefObject<OrbitControlsImpl> }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onUp   = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      keys.current = {};
    };
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const speed = 300 * delta;
    const forward = new THREE.Vector3();
    const right   = new THREE.Vector3();
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp'])    move.addScaledVector(forward,  speed);
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  move.addScaledVector(forward, -speed);
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  move.addScaledVector(right,   -speed);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) move.addScaledVector(right,    speed);

    if (move.lengthSq() === 0) return;
    camera.position.add(move);
    if (orbitRef.current) {
      (orbitRef.current as any).target.add(move);
      (orbitRef.current as any).update();
    }
  });

  return null;
}

// ── Ground plane ───────────────────────────────────────────────────────────
function Ground({ y = 0, sceneScale = 1 }: { y?: number; sceneScale?: number }) {
  // Cell size = sceneScale world units (≈1 m per cell), 50 cells total
  const cellSize = Math.max(1, sceneScale);
  const divisions = 50;
  const size = cellSize * divisions;
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0} transparent opacity={0.5} />
      </mesh>
      <gridHelper args={[size, divisions, '#555555', '#333333']} position={[0, 0.01, 0]} />
    </group>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
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
  groundY: number;
  sceneScale: number;
  wasdEnabled: boolean;
  orbitRef: React.RefObject<OrbitControlsImpl>;
  hideGround?: boolean;
  hidePanorama?: boolean;
}

function SceneContent({
  mannequins, props, selected, onSelect,
  onMannequinTransformEnd, onPropTransformEnd,
  panoramaUrl, groundY, sceneScale, wasdEnabled, orbitRef, hideGround, hidePanorama,
}: SceneContentProps) {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      <CameraSync groundY={groundY} panoramaMode={!!panoramaUrl} />
      <WASDControls enabled={wasdEnabled} orbitRef={orbitRef} />
      {panoramaUrl && !hidePanorama && <PanoramaBackground url={panoramaUrl} />}
      {!hideGround && <Ground y={groundY} sceneScale={sceneScale} />}
      {mannequins.map((m) => (
        <MannequinController
          key={m.id}
          mannequin={m}
          sceneScale={sceneScale}
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
          sceneScale={sceneScale}
          selected={selected?.kind === 'prop' && selected.id === p.id}
          onSelect={() => onSelect({ kind: 'prop', id: p.id })}
          onTransformEnd={(pos, rot) => onPropTransformEnd(p.id, pos, rot)}
          orbitRef={orbitRef}
        />
      ))}
    </>
  );
}

// ── Public component ───────────────────────────────────────────────────────
interface Director3dSceneProps {
  mannequins: MannequinState[];
  props: PropState[];
  selected: SelectedObject;
  onSelect: (s: SelectedObject) => void;
  onMannequinTransformEnd: (id: string, pos: [number, number, number], rot: [number, number, number]) => void;
  onPropTransformEnd: (id: string, pos: [number, number, number], rot: [number, number, number]) => void;
  panoramaUrl: string | null;
  groundY: number;
  sceneScale: number;
  wasdEnabled: boolean;
  cameraTarget?: [number, number, number];
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  preserveDrawingBuffer?: boolean;
  hideGround?: boolean;
  hidePanorama?: boolean;
}

export function Director3dScene({
  mannequins, props, selected, onSelect,
  onMannequinTransformEnd, onPropTransformEnd,
  panoramaUrl, groundY, sceneScale, wasdEnabled,
  cameraTarget, canvasRef, preserveDrawingBuffer = false, hideGround, hidePanorama,
}: Director3dSceneProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
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
        groundY={groundY}
        sceneScale={sceneScale}
        wasdEnabled={wasdEnabled}
        orbitRef={orbitRef}
        hideGround={hideGround}
        hidePanorama={hidePanorama}
      />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.05}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={1}
        maxDistance={500}
      />
    </Canvas>
  );
}
