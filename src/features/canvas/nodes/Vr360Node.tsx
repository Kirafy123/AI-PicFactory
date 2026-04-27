import { useState, useRef, useMemo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { createPortal } from 'react-dom';
import { Canvas as R3FCanvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { useCanvasStore } from '@/stores/canvasStore';
import { CANVAS_NODE_TYPES, type Vr360NodeData } from '@/features/canvas/domain/canvasNodes';
import { graphImageResolver } from '@/features/canvas/application/canvasServices';

interface PanoramaSphereProps {
  imageSrc: string;
  onReady?: () => void;
}

function PanoramaSphere({ imageSrc, onReady }: PanoramaSphereProps) {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(imageSrc, () => onReady?.());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [imageSrc, onReady]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 128, 128]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function convertFileSrc(src: string): string {
  if (!src) return src;
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  // Tauri local file path — convert to asset URL
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (window as any).__TAURI_INTERNALS__
      ? `http://asset.localhost/${encodeURIComponent(src.replace(/\\/g, '/').replace(/^\//, ''))}`
      : src;
  } catch {
    return src;
  }
}

interface Vr360NodeProps {
  id: string;
  data: Vr360NodeData;
}

export function Vr360Node({ id, data }: Vr360NodeProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const findNodePosition = useCanvasStore((s) => s.findNodePosition);

  const [fullscreen, setFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<any>(null);
  const [renderKey, setRenderKey] = useState(0);

  const incomingImages = useMemo(
    () => graphImageResolver.collectInputImages(id, nodes, edges),
    [id, nodes, edges]
  );
  const inputImage = incomingImages.length > 0 ? convertFileSrc(incomingImages[0]) : null;
  const panoramaUrl = inputImage || (data.backgroundUrl ? convertFileSrc(data.backgroundUrl) : null);

  const exportToNode = useCallback(
    (title: string, dataUrl: string) => {
      const position = findNodePosition(id, 480, 300);
      const newId = addNode(CANVAS_NODE_TYPES.upload, position, { imageUrl: dataUrl, displayName: title });
      addEdge(id, newId);
    },
    [id, findNodePosition, addNode, addEdge]
  );

  const renderGridReference = useCallback(
    async (gridCount: 4 | 12) => {
      if (!panoramaUrl) return;
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(panoramaUrl, resolve, undefined, reject);
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const scene = new THREE.Scene();
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(500, 128, 128),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      sphere.scale.x = -1;
      scene.add(sphere);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
      });
      renderer.setSize(1024, gridCount === 4 ? 1024 : 768);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
      camera.position.set(0, 0, 0);

      const cols = gridCount === 4 ? 2 : 4;
      const cellSize = 1024 / cols;
      const labels =
        gridCount === 4
          ? ['正面', '右面', '左面', '后面']
          : ['正面', '右面', '左面', '后面', '后上', '右上', '左上', '前上', '后下', '右下', '左下', '前下'];
      const directions = [
        { x: 0, y: 0, z: -1 },
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 1, z: 0 },
        { x: -1, y: 1, z: 0 },
        { x: 0, y: 1, z: -1 },
        { x: 0, y: -1, z: 1 },
        { x: 1, y: -1, z: 0 },
        { x: -1, y: -1, z: 0 },
        { x: 0, y: -1, z: -1 },
      ];

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = 1024;
      outputCanvas.height = gridCount === 4 ? 1024 : 768;
      const ctx = outputCanvas.getContext('2d')!;

      for (let i = 0; i < gridCount; i++) {
        const dir = directions[i];
        camera.lookAt(dir.x, dir.y, dir.z);
        renderer.render(scene, camera);
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.drawImage(renderer.domElement, col * cellSize, row * cellSize, cellSize, cellSize);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText(labels[i], col * cellSize + 40, row * cellSize + 80);
      }

      renderer.dispose();
      texture.dispose();
      return outputCanvas.toDataURL('image/jpeg', 0.95);
    },
    [panoramaUrl]
  );

  const handleGrid4 = useCallback(async () => {
    if (!panoramaUrl) return;
    const result = await renderGridReference(4);
    if (result) exportToNode('VR360-4宫格参考', result);
  }, [panoramaUrl, renderGridReference, exportToNode]);

  const handleGrid12 = useCallback(async () => {
    if (!panoramaUrl) return;
    const result = await renderGridReference(12);
    if (result) exportToNode('VR360-12宫格参考', result);
  }, [panoramaUrl, renderGridReference, exportToNode]);

  const handleExportCurrentView = useCallback(() => {
    if (!canvasRef.current) return;
    const gl = canvasRef.current.querySelector('canvas');
    if (!gl) return;
    const dataUrl = gl.toDataURL('image/jpeg', 0.95);
    exportToNode('VR360-当前视角', dataUrl);
  }, [exportToNode]);

  const fullscreenPortal =
    fullscreen &&
    panoramaUrl &&
    createPortal(
      <div
        className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-[96%] h-[96%] bg-black rounded-3xl overflow-hidden relative">
          <div className="absolute top-8 right-8 z-50 flex flex-wrap gap-3">
            <button
              onClick={handleExportCurrentView}
              disabled={!isReady}
              className={`px-8 py-4 text-xl font-bold rounded-3xl transition-all ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-600 cursor-not-allowed text-gray-400'
              }`}
            >
              {isReady ? '当前视角' : '渲染中...'}
            </button>
            <button
              onClick={handleGrid4}
              className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white text-xl font-bold rounded-3xl"
            >
              4宫格参考
            </button>
            <button
              onClick={handleGrid12}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white text-xl font-bold rounded-3xl"
            >
              12宫格参考
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold rounded-3xl"
            >
              关闭
            </button>
          </div>
          <R3FCanvas
            ref={canvasRef as any}
            camera={{ position: [0, 0, 0.1], fov: 75 }}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            style={{ background: '#000' }}
            onCreated={() => setIsReady(true)}
            key={`preview-${renderKey}`}
          >
            <PanoramaSphere imageSrc={panoramaUrl} onReady={() => setIsReady(true)} />
            <OrbitControls
              ref={orbitRef}
              enablePan={false}
              enableZoom={true}
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.5}
              zoomSpeed={1.2}
              minDistance={1}
              maxDistance={499}
            />
          </R3FCanvas>
        </div>
      </div>,
      document.body
    );

  return (
    <div
      className="bg-zinc-950 border-2 border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.15)] rounded-2xl p-4 w-[480px] relative overflow-hidden"
    >
      <Handle type="target" position={Position.Left} id="target" className="!bg-zinc-500" />
      <Handle type="source" position={Position.Right} id="source" className="!bg-zinc-500" />

      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">🌐</div>
        <div className="text-white text-lg font-bold">VR360 全景场景</div>
      </div>

      <div className="h-48 bg-black rounded-xl overflow-hidden mb-4 border border-cyan-400/30 relative">
        {panoramaUrl ? (
          <img src={panoramaUrl} className="w-full h-full object-cover cursor-pointer" onClick={() => {
            setRenderKey((k) => k + 1);
            setIsReady(false);
            setFullscreen(true);
          }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            连接上游图片节点或上传全景图
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            if (!panoramaUrl) return;
            setRenderKey((k) => k + 1);
            setIsReady(false);
            setFullscreen(true);
          }}
          disabled={!panoramaUrl}
          className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
        >
          全屏预览
        </button>
        <button
          onClick={handleGrid4}
          disabled={!panoramaUrl}
          className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
        >
          4宫格
        </button>
        <button
          onClick={handleGrid12}
          disabled={!panoramaUrl}
          className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
        >
          12宫格
        </button>
      </div>

      {fullscreenPortal}
    </div>
  );
}
