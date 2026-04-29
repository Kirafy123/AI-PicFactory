import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { createPortal } from 'react-dom';

import { useCanvasStore } from '@/stores/canvasStore';
import {
  CANVAS_NODE_TYPES,
  type Director3dNodeData,
  type Vr360NodeData,
  isVr360Node,
} from '@/features/canvas/domain/canvasNodes';
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
  const [groundY, setGroundY] = useState(0);
  const [baseSceneScale, setBaseSceneScale] = useState(5);
  const [sceneScaleMultiplier, setSceneScaleMultiplier] = useState(1);
  const sceneScale = baseSceneScale * sceneScaleMultiplier;
  const [wasdEnabled, setWasdEnabled] = useState(false);
  const [mannequins, setMannequins] = useState<MannequinState[]>([
    { id: 'm0', color: '#ef4444', position: [0, 0, 0], rotation: [0, 0, 0], pose: 'stand', scale: 1 },
  ]);
  const [props, setProps] = useState<PropState[]>([]);
  const [selected, setSelected] = useState<SelectedObject>(null);
  const [propCategory, setPropCategory] = useState('几何模型');
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | undefined>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hideGround, setHideGround] = useState(false);
  const [hidePanorama, setHidePanorama] = useState(false);
  const [showExportPrompt, setShowExportPrompt] = useState(false);

  const incomingImages = useMemo(
    () => graphImageResolver.collectInputImages(id, nodes, edges),
    [id, nodes, edges]
  );

  // Find connected VR360 node (either direction)
  const vr360SourceNode = useMemo(() => {
    const connectedIds = edges
      .filter((e) => e.source === id || e.target === id)
      .map((e) => (e.source === id ? e.target : e.source));
    return nodes.filter((n) => connectedIds.includes(n.id)).find(isVr360Node) ?? null;
  }, [id, nodes, edges]);

  const vr360Data = vr360SourceNode ? (vr360SourceNode.data as Vr360NodeData) : null;

  // Ground is in world space; calibratedGroundY is already sphere-space Y, use directly.
  const effectiveGroundY =
    vr360Data?.calibratedGroundY !== undefined
      ? vr360Data.calibratedGroundY
      : groundY;

  // Auto-set sceneScale when VR360 ground calibration changes: abs(calibratedGroundY) * 0.5, min 1
  const prevCalibrationRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const cal = vr360Data?.calibratedGroundY;
    if (cal === undefined) return;
    if (cal === prevCalibrationRef.current) return;
    prevCalibrationRef.current = cal;
    const auto = Math.min(100, Math.max(0.5, Math.abs(cal) * 0.5));
    setBaseSceneScale(auto);
    setSceneScaleMultiplier(1);
  }, [vr360Data?.calibratedGroundY]);

  // When ground Y changes, shift all mannequins/props to stay on the ground
  const prevGroundYRef = useRef(0);
  useEffect(() => {
    const delta = effectiveGroundY - prevGroundYRef.current;
    prevGroundYRef.current = effectiveGroundY;
    if (delta === 0) return;
    setMannequins((prev) =>
      prev.map((m) => ({ ...m, position: [m.position[0], m.position[1] + delta, m.position[2]] as [number, number, number] }))
    );
    setProps((prev) =>
      prev.map((p) => ({ ...p, position: [p.position[0], p.position[1] + delta, p.position[2]] as [number, number, number] }))
    );
  }, [effectiveGroundY]);

  // When upstream is VR360, trace through it to get its own upstream panorama
  const panoramaUrl = useMemo(() => {
    if (vr360SourceNode) {
      const vr360Images = graphImageResolver.collectInputImages(vr360SourceNode.id, nodes, edges);
      const src = vr360Images[0] ?? (vr360SourceNode.data as Vr360NodeData).backgroundUrl ?? null;
      return src ? convertFileSrc(src) : null;
    }
    const src = incomingImages[0] ?? data.backgroundUrl ?? null;
    return src ? convertFileSrc(src) : null;
  }, [vr360SourceNode, incomingImages, data.backgroundUrl, nodes, edges]);

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
    const color = MANNEQUIN_COLORS[mannequins.length % MANNEQUIN_COLORS.length];
    const newM: MannequinState = {
      id: `m${Date.now()}`,
      color,
      position: [0, effectiveGroundY, 0],
      rotation: [0, 0, 0],
      pose: 'stand',
      scale: 1,
    };
    setMannequins((prev) => [...prev, newM]);
  }, [mannequins.length, effectiveGroundY]);

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
      position: [0, effectiveGroundY, 0],
      rotation: [0, 0, 0],
      scale: 1,
    };
    setProps((prev) => [...prev, newP]);
  }, [effectiveGroundY]);

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

  const exportCurrentView = useCallback(async (withBackground: boolean) => {
    const gl = canvasRef.current;
    if (!gl) return;

    setHideGround(true);
    if (!withBackground) setHidePanorama(true);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const colorDataUrl = gl.toDataURL('image/jpeg', 0.95);
    setHideGround(false);
    setHidePanorama(false);

    const pos1 = findNodePosition(id, 480, 300);
    const colorId = addNode(CANVAS_NODE_TYPES.upload, pos1, {
      imageUrl: colorDataUrl,
      displayName: '3D视角布局图',
    });
    addEdge(id, colorId);
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
          groundY={effectiveGroundY}
          sceneScale={sceneScale}
          wasdEnabled={wasdEnabled}
          cameraTarget={cameraTarget}
          canvasRef={canvasRef}
          preserveDrawingBuffer
          hideGround={hideGround}
          hidePanorama={hidePanorama}
        />

        {/* top toolbar */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setWasdEnabled((v) => !v)}
            className={`px-4 py-2 text-white text-sm font-bold rounded-lg ${wasdEnabled ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            title="WASD/方向键移动镜头，滚轮推拉"
          >
            {wasdEnabled ? '🎮 移动中' : '🎮 移动镜头'}
          </button>
          <button
            onClick={() => setShowExportPrompt(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg"
          >
            导出视角及布局图
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
        {/* Export confirmation overlay */}
        {showExportPrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col gap-4 w-72 shadow-2xl">
              <div className="text-sm font-bold text-zinc-200">导出选项</div>
              <div className="text-xs text-zinc-400 leading-5">是否保留场景图作为导出背景？</div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowExportPrompt(false); void exportCurrentView(false); }}
                  className="px-4 py-2 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors"
                >
                  不保留
                </button>
                <button
                  onClick={() => { setShowExportPrompt(false); void exportCurrentView(true); }}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  保留背景
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right panel - camera presets + ground adjust */}
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
        <div className="p-3 border-t border-zinc-700">
          <div className="text-xs font-bold text-zinc-300 mb-2">场景缩放</div>
          <input
            type="range"
            min={0.1}
            max={4}
            step={0.05}
            value={sceneScaleMultiplier}
            onChange={(e) => setSceneScaleMultiplier(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>0.1x</span>
            <span className="text-zinc-300">{sceneScaleMultiplier.toFixed(2)}x</span>
            <span>4x</span>
          </div>
        </div>
        <div className="p-3 border-t border-zinc-700">
          <div className="text-xs font-bold text-zinc-300 mb-2">地表高度</div>
          <input
            type="range"
            min={-30}
            max={30}
            step={0.5}
            value={effectiveGroundY}
            onChange={(e) => setGroundY(Number(e.target.value))}
            disabled={vr360Data?.calibratedGroundY !== undefined}
            className="w-full accent-cyan-500 disabled:opacity-40"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>-30</span>
            <span className="text-zinc-300">{effectiveGroundY.toFixed(1)}</span>
            <span>+30</span>
          </div>
          {vr360Data?.calibratedGroundY !== undefined && (
            <div className="text-xs text-teal-500/70 mt-1">
              由 VR360 控制 · 球面Y={vr360Data.calibratedGroundY} · 场景Y={effectiveGroundY.toFixed(2)}
            </div>
          )}
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
      {vr360Data && (
        <div className="mb-2 text-xs text-teal-400/80 flex items-center gap-1">
          <span>●</span>
          <span>已从 VR360 同步地面 · 球面Y {vr360Data.calibratedGroundY ?? 0}</span>
        </div>
      )}

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
