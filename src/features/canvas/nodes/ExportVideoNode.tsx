import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from '@xyflow/react';
import { AlertTriangle, Download, FolderOpen, Pause, Play, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { save } from '@tauri-apps/plugin-dialog';

import { saveImageSourceToPath, saveImageSourceToDirectory } from '@/commands/image';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  CANVAS_NODE_TYPES,
  EXPORT_RESULT_NODE_MIN_WIDTH,
  EXPORT_RESULT_NODE_MIN_HEIGHT,
  type CanvasNodeType,
  type ExportVideoNodeData,
} from '@/features/canvas/domain/canvasNodes';
import { resolveNodeDisplayName } from '@/features/canvas/domain/nodeDisplay';
import { NodeHeader, NODE_HEADER_FLOATING_POSITION_CLASS } from '@/features/canvas/ui/NodeHeader';
import { NodeResizeHandle } from '@/features/canvas/ui/NodeResizeHandle';
import { reduceAspectRatio } from '@/features/canvas/application/imageData';
import { useCanvasStore } from '@/stores/canvasStore';

type ExportVideoNodeProps = NodeProps & {
  id: string;
  data: ExportVideoNodeData;
  selected?: boolean;
};

function resolveNodeDimension(value: number | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 1) {
    return Math.round(value);
  }
  return fallback;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const DEFAULT_WIDTH = 384;
const DEFAULT_HEIGHT = 288;

export const ExportVideoNode = memo(({ id, data, selected, type, width, height }: ExportVideoNodeProps) => {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const setSelectedNode = useCanvasStore((state) => state.setSelectedNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const addNode = useCanvasStore((state) => state.addNode);
  const addEdgeToStore = useCanvasStore((state) => state.addEdge);
  const findNodePosition = useCanvasStore((state) => state.findNodePosition);
  const [now, setNow] = useState(() => Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const downloadPresetPaths = useSettingsStore((state) => state.downloadPresetPaths);
  const [downloadMenu, setDownloadMenu] = useState<{ x: number; y: number } | null>(null);
  const [isDownloadMenuVisible, setIsDownloadMenuVisible] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);
  const downloadMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGenerating = typeof data.isGenerating === 'boolean' ? data.isGenerating : false;
  const generationError = typeof (data as { generationError?: unknown }).generationError === 'string'
    ? ((data as { generationError?: string }).generationError ?? '').trim()
    : '';
  const hasGenerationError = !isGenerating && !data.videoUrl && generationError.length > 0;
  const generationStartedAt = typeof data.generationStartedAt === 'number' ? data.generationStartedAt : null;
  const generationDurationMs = typeof data.generationDurationMs === 'number' ? data.generationDurationMs : 300000;

  const resolvedWidth = resolveNodeDimension(width, DEFAULT_WIDTH);
  const resolvedHeight = resolveNodeDimension(height, DEFAULT_HEIGHT);

  const resolvedTitle = useMemo(
    () => resolveNodeDisplayName(type as CanvasNodeType, data),
    [data, type]
  );

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, resolvedHeight, resolvedWidth, updateNodeInternals]);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(() => { setNow(Date.now()); }, 120);
    return () => { window.clearInterval(timer); };
  }, [isGenerating]);

  const simulatedProgress = useMemo(() => {
    if (!isGenerating) return 0;
    const startedAt = generationStartedAt ?? Date.now();
    const dur = Math.max(1000, generationDurationMs);
    const elapsed = Math.max(0, now - startedAt);
    return Math.min(elapsed / dur, 0.96);
  }, [generationDurationMs, generationStartedAt, isGenerating, now]);

  const waitedMinutes = useMemo(() => {
    if (!isGenerating || generationStartedAt === null) return 0;
    return Math.floor(Math.max(0, now - generationStartedAt) / 60000);
  }, [generationStartedAt, isGenerating, now]);

  const waitingText = useMemo(() => {
    if (!isGenerating || waitedMinutes < 2) {
      return t('node.exportVideo.waitingResult', '视频生成中...');
    }
    return t('node.exportVideo.waitingResultDelayed', { minutes: waitedMinutes, defaultValue: `已等待 ${waitedMinutes} 分钟，请耐心等待` });
  }, [isGenerating, t, waitedMinutes]);

  const handleVideoLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDuration(video.duration || 0);
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  }, []);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const captureFrame = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const aspect = video.videoWidth && video.videoHeight
        ? reduceAspectRatio(video.videoWidth, video.videoHeight)
        : data.aspectRatio || '16:9';
      const newPos = findNodePosition(id, 220, 160);
      const newId = addNode(CANVAS_NODE_TYPES.exportImage, newPos, {
        imageUrl: dataUrl,
        previewImageUrl: dataUrl,
        aspectRatio: aspect,
      });
      addEdgeToStore(id, newId);
    } catch (err) {
      console.error('[captureFrame] failed:', err);
    }
  }, [addEdgeToStore, addNode, data.aspectRatio, findNodePosition, id]);

  const closeDownloadMenu = useCallback(() => {
    setIsDownloadMenuVisible(false);
    if (downloadMenuCloseTimerRef.current) clearTimeout(downloadMenuCloseTimerRef.current);
    downloadMenuCloseTimerRef.current = setTimeout(() => {
      setDownloadMenu(null);
      downloadMenuCloseTimerRef.current = null;
    }, 150);
  }, []);

  const handleDownloadSaveAs = useCallback(async () => {
    if (!data.videoUrl) return;
    try {
      const selectedPath = await save({
        defaultPath: `video-${id}.mp4`,
        filters: [{ name: 'Video', extensions: ['mp4', 'webm', 'mov'] }],
      });
      if (!selectedPath) return;
      await saveImageSourceToPath(data.videoUrl, selectedPath);
      closeDownloadMenu();
    } catch (err) {
      console.error('[downloadVideo] save-as failed:', err);
    }
  }, [closeDownloadMenu, data.videoUrl, id]);

  const handleDownloadToPreset = useCallback(async (targetDir: string) => {
    if (!data.videoUrl) return;
    try {
      await saveImageSourceToDirectory(data.videoUrl, targetDir, `video-${id}`);
      closeDownloadMenu();
    } catch (err) {
      console.error('[downloadVideo] preset failed:', err);
    }
  }, [closeDownloadMenu, data.videoUrl, id]);

  useEffect(() => {
    if (!downloadMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (downloadMenuRef.current?.contains(event.target as Node)) return;
      closeDownloadMenu();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [closeDownloadMenu, downloadMenu]);

  useEffect(() => {
    if (!downloadMenu) return;
    const frameId = requestAnimationFrame(() => setIsDownloadMenuVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, [downloadMenu]);

  useEffect(() => {
    return () => {
      if (downloadMenuCloseTimerRef.current) clearTimeout(downloadMenuCloseTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`
        group relative overflow-visible rounded-[var(--node-radius)] border bg-surface-dark/85 p-0 transition-colors duration-150
        ${hasGenerationError
          ? (selected
            ? 'border-red-400 shadow-[0_0_0_1px_rgba(248,113,113,0.42)]'
            : 'border-red-500/70 bg-[rgba(127,29,29,0.12)] hover:border-red-400/80')
          : selected
            ? 'border-accent shadow-[0_0_0_1px_rgba(59,130,246,0.32)]'
            : 'border-[rgba(15,23,42,0.22)] hover:border-[rgba(15,23,42,0.34)] dark:border-[rgba(255,255,255,0.22)] dark:hover:border-[rgba(255,255,255,0.34)]'}
      `}
      style={{ width: resolvedWidth, height: resolvedHeight }}
      onClick={() => setSelectedNode(id)}
    >
      <NodeHeader
        className={NODE_HEADER_FLOATING_POSITION_CLASS}
        icon={<Video className="h-4 w-4" />}
        titleText={resolvedTitle}
        titleClassName="inline-block max-w-[220px] truncate whitespace-nowrap align-bottom"
        editable
        onTitleChange={(nextTitle) => updateNodeData(id, { displayName: nextTitle })}
      />

      <div className={`relative h-full w-full overflow-hidden rounded-[var(--node-radius)] ${hasGenerationError ? 'bg-[rgba(127,29,29,0.2)]' : 'bg-bg-dark'}`}>
        {data.videoUrl ? (
          <>
            {/* Video — crossOrigin allows canvas capture for CDN URLs */}
            <video
              ref={videoRef}
              src={data.videoUrl}
              crossOrigin="anonymous"
              preload="auto"
              className="h-full w-full cursor-pointer object-contain"
              style={{ paddingBottom: 36 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={togglePlay}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Custom controls bar — always visible at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-black/70 px-2 py-2"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/90 hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>

              <input
                type="range"
                min="0"
                max={videoDuration || 1}
                step="0.05"
                value={currentTime}
                className="h-1 min-w-0 flex-1 cursor-pointer accent-blue-400"
                onChange={handleScrub}
              />

              <span className="shrink-0 text-[10px] tabular-nums text-white/60">
                {formatTime(currentTime)}
              </span>

              <button
                className="shrink-0 rounded bg-white/20 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/35"
                onClick={captureFrame}
              >
                {t('node.upload.captureFrame', '截帧')}
              </button>

              <button
                className="shrink-0 flex items-center gap-1 rounded bg-white/20 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/35"
                onClick={(e) => {
                  e.stopPropagation();
                  if (downloadPresetPaths.length === 0) {
                    void handleDownloadSaveAs();
                    return;
                  }
                  setDownloadMenu({ x: e.clientX, y: e.clientY });
                  setIsDownloadMenuVisible(false);
                }}
              >
                <Download className="h-3 w-3" />
                {t('nodeToolbar.download')}
              </button>
            </div>
          </>
        ) : hasGenerationError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-red-300">
            <AlertTriangle className="h-7 w-7 opacity-90" />
            <span className="text-center text-[12px] font-medium leading-5 text-red-200">
              {t('node.exportVideo.generationFailed', '视频生成失败')}
            </span>
            <span className="max-h-[88px] overflow-y-auto break-words text-center text-[11px] leading-5 text-red-200/90">
              {generationError}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-text-muted/85">
            <Video className="h-7 w-7 opacity-60" />
            <span className="px-4 text-center text-[12px] leading-6">{waitingText}</span>
          </div>
        )}

        {isGenerating && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-bg-dark/55" />
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[rgba(255,255,255,0.4)] to-[rgba(255,255,255,0.06)] transition-[width] duration-100 ease-linear"
              style={{ width: `${simulatedProgress * 100}%` }}
            />
          </div>
        )}
      </div>

      <Handle type="target" id="target" position={Position.Left} className="!h-2 !w-2 !border-surface-dark !bg-accent" />
      <Handle type="source" id="source" position={Position.Right} className="!h-2 !w-2 !border-surface-dark !bg-accent" />

      <NodeResizeHandle
        minWidth={EXPORT_RESULT_NODE_MIN_WIDTH}
        minHeight={EXPORT_RESULT_NODE_MIN_HEIGHT}
        maxWidth={1600}
        maxHeight={1600}
      />

      {downloadMenu && (
        <div
          ref={downloadMenuRef}
          className={`fixed z-[120] min-w-[200px] rounded-xl border border-[rgba(255,255,255,0.18)] bg-surface-dark/95 p-2 shadow-2xl backdrop-blur-sm transition-opacity duration-150 ${isDownloadMenuVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: `${downloadMenu.x}px`, top: `${Math.max(downloadMenu.y - 110, 8)}px` }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-text-dark transition-colors hover:bg-bg-dark"
            onClick={() => void handleDownloadSaveAs()}
          >
            <Download className="h-4 w-4" />
            {t('nodeToolbar.saveAs')}
          </button>
          {downloadPresetPaths.length > 0 && (
            <div className="mt-1 space-y-1 border-t border-[rgba(255,255,255,0.1)] pt-2">
              {downloadPresetPaths.map((path) => (
                <button
                  key={path}
                  type="button"
                  className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-text-dark transition-colors hover:bg-bg-dark"
                  onClick={() => void handleDownloadToPreset(path)}
                  title={path}
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{path}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ExportVideoNode.displayName = 'ExportVideoNode';
