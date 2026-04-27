import { useState, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { createPortal } from 'react-dom';

import { useCanvasStore } from '@/stores/canvasStore';
import { CANVAS_NODE_TYPES, type Director3dNodeData } from '@/features/canvas/domain/canvasNodes';
import { graphImageResolver } from '@/features/canvas/application/canvasServices';

import { Director3dScene, type SelectedObject } from './Director3dScene';
import {
  PROP_CATEGORIES,
  POSE_CATEGORIES,
  CAMERA_PRESETS,
  type MannequinState,
  type PropState,
} from './catalog';

interface Director3dNodeProps {
  id: string;
  data: Director3dNodeData;
}

const MANNEQUIN_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'];

function convertFileSrc(src: string): string {
  if (!src) return src;
  if (
    src.startsWith('data:') ||
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('blob:')
  ) {
    return src;
  }
  return (window as any).__TAURI_INTERNALS__
    ? `http://asset.localhost/${encodeURIComponent(src.replace(/\\/g, '/').replace(/^\//, ''))}`
    : src;
}

export function Director3dNode({ id, data }: Director3dNodeProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const findNodePosition = useCanvasStore((s) => s.findNodePosition);

  const [fullscreen, setFullscreen] = useState(false);
  const [mannequins, setMannequins] = useState<MannequinState[]>([
    { id: 'm0', color: '#ef4444', position: [-2, 0, 0], rotation: [0, 0, 0], pose: 'stand', scale: 1 },
    { id: 'm1', color: '#22c55e', position: [2, 0, 0], rotation: [0, Math.PI, 0], pose: 'stand', scale: 1 },
  ]);
  const [props, setProps] = useState<PropState[]>([]);
  const [selected, setSelected] = useState<SelectedObject>(null);
  const [propCategory, setPropCategory] = useState('几何模型');
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | undefined>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const incomingImages = useMemo(
    () => graphImageResolver.collectInputImages(id, nodes, edges),
    [id, nodes, edges]
  );
  const panoramaUrl = useMemo(() => {
    const src = incomingImages[0] ?? data.backgroundUrl ?? null;
    return src ? convertFileSrc(src) : null;
  }, [incomingImages, data.backgroundUrl]);

  // ── helpers ────────────────────────────────────────────────────

  const handleMannequinTransformEnd = useCallback(
    (mid: string, pos: [number, number, number], rot: [number, number, number]) => {
      setMannequins((prev) =>
        prev.map((m) => (m.id === mid ? { ...m, position: pos, rotation: rot } : m))
      );
    },
    []
  );

  const handlePropTransformEnd = useCallback(
    (pid: string, pos: [number, number, number], rot: [number, number, number]) => {
      setProps((prev) =>
        prev.map((p) => (p.id === pid ? { ...p, position: pos, rotation: rot } : p))
      );
    },
    []
  );

  const addMannequin = useCallback(() => {
    const idx = mannequins.length;
    const color = MANNEQUIN_COLORS[idx % MANNEQUIN_COLORS.length];
    const newM: MannequinState = {
      id: `m${Date.now()}`,
      color,
      position: [(idx % 3) * 2 - 2, 0, Math.floor(idx / 3) * 2],
      rotation: [0, 0, 0],
      pose: 'stand',
      scale: 1,
    };
    setMannequins((prev) => [...prev, newM]);
  }, [mannequins.length]);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    if (selected.kind === 'mannequin') {
      setMannequins((prev) => prev.filter((m) => m.id !== selected.id));
    } else {
      setProps((prev) => prev.filter((p) => p.id !== selected.id));
    }
    setSelected(null);
  }, [selected]);

  const addProp = useCallback((propId: string, color: string) => {
    const newP: PropState = {
      id: `p${Date.now()}`,
      propId,
      color,
      position: [Math.random() * 4 - 2, 0, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: 1,
    };
    setProps((prev) => [...prev, newP]);
  }, []);

  const setPose = useCallback((pose: string) => {
    if (!selected || selected.kind !== 'mannequin') return;
    setMannequins((prev) =>
      prev.map((m) => (m.id === selected.id ? { ...m, pose } : m))
    );
  }, [selected]);

  const rotateMannequinLeft = useCallback(() => {
    if (!selected || selected.kind !== 'mannequin') return;
    setMannequins((prev) =>
      prev.map((m) =>
        m.id === selected.id
          ? { ...m, rotation: [m.rotation[0], m.rotation[1] + Math.PI / 12, m.rotation[2]] }
          : m
      )
    );
  }, [selected]);

  const setScale = useCallback((scale: number) => {
    if (!selected || selected.kind !== 'prop') return;
    setProps((prev) =>
      prev.map((p) => (p.id === selected.id ? { ...p, scale } : p))
    );
  }, [selected]);

  const setMannequinScale = useCallback((scale: number) => {
    if (!selected || selected.kind !== 'mannequin') return;
    setMannequins((prev) =>
      prev.map((m) => (m.id === selected.id ? { ...m, scale } : m))
    );
  }, [selected]);

  // ── export ─────────────────────────────────────────────────────

  const exportCurrentView = useCallback(async () => {
    const gl = canvasRef.current;
    if (!gl) return;

    const colorDataUrl = gl.toDataURL('image/jpeg', 0.95);

    // Generate depth map from pixel brightness
    const ctx2 = document.createElement('canvas');
    ctx2.width = gl.width;
    ctx2.height = gl.height;
    const ctx = ctx2.getContext('2d')!;
    ctx.drawImage(gl, 0, 0);
    const imgData = ctx.getImageData(0, 0, ctx2.width, ctx2.height);
    const { data: px } = imgData;
    for (let i = 0; i < px.length; i += 4) {
      const brightness = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114);
      const g = brightness < 15 ? 0 : Math.min(255, Math.pow(brightness / 255, 0.8) * 255);
      px[i] = px[i + 1] = px[i + 2] = g;
      px[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const depthDataUrl = ctx2.toDataURL('image/jpeg', 0.9);

    const pos1 = findNodePosition(id, 480, 300);
    const colorId = addNode(CANVAS_NODE_TYPES.upload, pos1, {
      imageUrl: colorDataUrl,
      displayName: '3D当前视角',
    });
    addEdge(id, colorId);

    const pos2 = { x: pos1.x + 500, y: pos1.y };
    const depthId = addNode(CANVAS_NODE_TYPES.upload, pos2, {
      imageUrl: depthDataUrl,
      displayName: '3D深度图',
    });
    addEdge(id, depthId);
  }, [id, findNodePosition, addNode, addEdge]);

  // ── selected object info ────────────────────────────────────────

  const selectedMannequin = selected?.kind === 'mannequin'
    ? mannequins.find((m) => m.id === selected.id)
    : null;
  const selectedProp = selected?.kind === 'prop'
    ? props.find((p) => p.id === selected.id)
    : null;
  const currentPropCategory = PROP_CATEGORIES.find((c) => c.id === propCategory);

  // ── fullscreen portal ──────────────────────────────────────────

  const fullscreenPortal = fullscreen && createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black flex"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Left panel */}
      <div className="w-52 bg-zinc-900 border-r border-zinc-700 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-zinc-700 text-xs font-bold text-zinc-300">道具库</div>
        {/* category tabs */}
        <div className="flex flex-col gap-0.5 p-2 border-b border-zinc-700">
          {PROP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setPropCategory(cat.id)}
              className={`text-left text-xs px-2 py-1 rounded transition-colors ${
                propCategory === cat.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {/* prop items */}
        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-1 content-start">
          {currentPropCategory?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => addProp(item.id, item.color)}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="truncate w-full text-center">{item.name}</span>
            </button>
          ))}
        </div>
        {/* mannequin section */}
        <div className="p-2 border-t border-zinc-700">
          <div className="text-xs font-bold text-zinc-300 mb-2">拟人体</div>
          <button
            onClick={addMannequin}
            className="w-full text-xs py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded transition-colors"
          >
            + 添加角色
          </button>
        </div>
      </div>

      {/* 3D viewport */}
      <div className="flex-1 relative">
        <Director3dScene
          mannequins={mannequins}
          props={props}
          selected={selected}
          onSelect={setSelected}
          onMannequinTransformEnd={handleMannequinTransformEnd}
          onPropTransformEnd={handlePropTransformEnd}
          panoramaUrl={panoramaUrl}
          cameraTarget={cameraTarget}
          canvasRef={canvasRef}
          preserveDrawingBuffer
        />

        {/* top toolbar */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={exportCurrentView}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg"
          >
            导出视角 + 深度图
          </button>
          <button
            onClick={() => setFullscreen(false)}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-lg"
          >
            关闭
          </button>
        </div>

        {/* selected object controls - bottom bar */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 border border-zinc-700 rounded-xl px-4 py-2">
            {selectedMannequin && (
              <>
                <span className="text-xs text-zinc-400">姿势：</span>
                {POSE_CATEGORIES.flatMap((c) => c.items).map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => setPose(pose.id)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      selectedMannequin.pose === pose.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {pose.name}
                  </button>
                ))}
                <div className="w-px h-4 bg-zinc-600 mx-1" />
                <button
                  onClick={rotateMannequinLeft}
                  title="往左手方向旋转 15°"
                  className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 rounded transition-colors"
                >
                  ↺ 转向
                </button>
                <div className="w-px h-4 bg-zinc-600 mx-1" />
                <span className="text-xs text-zinc-400">大小：</span>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.05}
                  value={selectedMannequin.scale}
                  onChange={(e) => setMannequinScale(Number(e.target.value))}
                  className="w-24 accent-cyan-500"
                />
                <span className="text-xs text-zinc-300 w-8">{selectedMannequin.scale.toFixed(1)}x</span>
              </>
            )}
            {selectedProp && (
              <>
                <span className="text-xs text-zinc-400">缩放：</span>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.05}
                  value={selectedProp.scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-28 accent-cyan-500"
                />
                <span className="text-xs text-zinc-300 w-8">{selectedProp.scale.toFixed(1)}x</span>
              </>
            )}
            <button
              onClick={removeSelected}
              className="ml-2 text-xs px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {/* Right panel - camera presets + pose */}
      <div className="w-40 bg-zinc-900 border-l border-zinc-700 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-zinc-700 text-xs font-bold text-zinc-300">相机预设</div>
        <div className="flex flex-col gap-1 p-2">
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setCameraTarget(preset.position)}
              className="text-xs px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors text-left"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  // ── compact card ──────────────────────────────────────────────

  return (
    <div className="bg-zinc-950 border-2 border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.15)] rounded-2xl p-4 w-[480px] relative overflow-hidden">
      <Handle type="target" position={Position.Left} id="target" className="!bg-zinc-500" />
      <Handle type="source" position={Position.Right} id="source" className="!bg-zinc-500" />

      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">🎬</div>
        <div className="text-white text-lg font-bold">3D 导演台</div>
        <div className="ml-auto flex gap-1 text-xs text-zinc-400">
          <span>{mannequins.length} 角色</span>
          <span>·</span>
          <span>{props.length} 道具</span>
        </div>
      </div>

      {/* compact preview - static scene info */}
      <div className="h-36 bg-zinc-900 rounded-xl overflow-hidden mb-3 border border-violet-400/20 relative flex items-center justify-center">
        <div className="text-center text-zinc-500 text-sm">
          {panoramaUrl ? (
            <img src={panoramaUrl} className="w-full h-full object-cover absolute inset-0" />
          ) : null}
          <div className="relative z-10 text-zinc-400 text-xs">
            {panoramaUrl ? '已加载全景背景' : '连接全景图节点作为背景'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFullscreen(true)}
          className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          全屏编辑
        </button>
        <button
          onClick={addMannequin}
          className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
        >
          + 角色
        </button>
        {PROP_CATEGORIES.slice(-1)[0].items.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => addProp(item.id, item.color)}
            className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            {item.emoji} {item.name}
          </button>
        ))}
      </div>

      {fullscreenPortal}
    </div>
  );
}
