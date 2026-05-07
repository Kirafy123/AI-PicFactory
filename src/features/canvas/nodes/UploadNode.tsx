import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
} from 'react';
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  useViewport,
  type NodeProps,
} from '@xyflow/react';
import { Music, Pause, Play, Upload, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CANVAS_NODE_TYPES,
  EXPORT_RESULT_NODE_MIN_HEIGHT,
  EXPORT_RESULT_NODE_MIN_WIDTH,
  type UploadImageNodeData,
} from '@/features/canvas/domain/canvasNodes';
import {
  resolveMinEdgeFittedSize,
  resolveResizeMinConstraintsByAspect,
} from '@/features/canvas/application/imageNodeSizing';
import {
  isNodeUsingDefaultDisplayName,
  resolveNodeDisplayName,
} from '@/features/canvas/domain/nodeDisplay';
import { canvasEventBus } from '@/features/canvas/application/canvasServices';
import { NodeHeader, NODE_HEADER_FLOATING_POSITION_CLASS } from '@/features/canvas/ui/NodeHeader';
import { NodeResizeHandle } from '@/features/canvas/ui/NodeResizeHandle';
import {
  prepareNodeImageFromFile,
  reduceAspectRatio,
  resolveImageDisplayUrl,
  shouldUseOriginalImageByZoom,
} from '@/features/canvas/application/imageData';
import { CanvasNodeImage } from '@/features/canvas/ui/CanvasNodeImage';
import { useCanvasStore } from '@/stores/canvasStore';
import { useSettingsStore } from '@/stores/settingsStore';

type UploadNodeProps = NodeProps & {
  id: string;
  data: UploadImageNodeData;
  selected?: boolean;
};

function resolveNodeDimension(value: number | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 1) {
    return Math.round(value);
  }
  return fallback;
}

function resolveDroppedMediaFile(event: DragEvent<HTMLElement>): File | null {
  const directFile = event.dataTransfer.files?.[0];
  if (directFile) {
    return directFile;
  }

  const item = Array.from(event.dataTransfer.items || []).find(
    (candidate) =>
      candidate.kind === 'file' &&
      (candidate.type.startsWith('image/') ||
        candidate.type.startsWith('video/') ||
        candidate.type.startsWith('audio/'))
  );
  return item?.getAsFile() ?? null;
}

function resolveMediaCategory(file: File): 'image' | 'video' | 'audio' | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

export const UploadNode = memo(({ id, data, selected, width, height }: UploadNodeProps) => {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const setSelectedNode = useCanvasStore((state) => state.setSelectedNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const addNode = useCanvasStore((state) => state.addNode);
  const addEdgeToStore = useCanvasStore((state) => state.addEdge);
  const findNodePosition = useCanvasStore((state) => state.findNodePosition);
  const useUploadFilenameAsNodeTitle = useSettingsStore((state) => state.useUploadFilenameAsNodeTitle);
  const { zoom } = useViewport();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadSequenceRef = useRef(0);
  const uploadPerfRef = useRef<{
    sequence: number;
    name: string;
    size: number;
    startedAt: number;
    transientLoaded: boolean;
    stableLoaded: boolean;
  } | null>(null);
  const [transientPreviewUrl, setTransientPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaType = data.mediaType ?? 'image';
  const resolvedAspectRatio = data.aspectRatio || '1:1';
  const compactSize = resolveMinEdgeFittedSize(resolvedAspectRatio, {
    minWidth: EXPORT_RESULT_NODE_MIN_WIDTH,
    minHeight: EXPORT_RESULT_NODE_MIN_HEIGHT,
  });
  const resolvedWidth = resolveNodeDimension(width, compactSize.width);
  const resolvedHeight = resolveNodeDimension(height, compactSize.height);
  const resizeConstraints = resolveResizeMinConstraintsByAspect(resolvedAspectRatio, {
    minWidth: EXPORT_RESULT_NODE_MIN_WIDTH,
    minHeight: EXPORT_RESULT_NODE_MIN_HEIGHT,
  });
  const resizeMinWidth = resizeConstraints.minWidth;
  const resizeMinHeight = resizeConstraints.minHeight;
  const resolvedTitle = useMemo(() => {
    const sourceFileName = typeof data.sourceFileName === 'string' ? data.sourceFileName.trim() : '';
    if (
      useUploadFilenameAsNodeTitle
      && sourceFileName
      && isNodeUsingDefaultDisplayName(CANVAS_NODE_TYPES.upload, data)
    ) {
      return sourceFileName;
    }

    return resolveNodeDisplayName(CANVAS_NODE_TYPES.upload, data);
  }, [data, useUploadFilenameAsNodeTitle]);

  const clearTransientPreview = useCallback(() => {
    setTransientPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const category = resolveMediaCategory(file);
      if (!category) return;

      if (category === 'image') {
        const sequence = uploadSequenceRef.current + 1;
        uploadSequenceRef.current = sequence;
        const started = performance.now();
        clearTransientPreview();
        const optimisticPreviewUrl = URL.createObjectURL(file);
        setTransientPreviewUrl(optimisticPreviewUrl);
        uploadPerfRef.current = {
          sequence,
          name: file.name,
          size: file.size,
          startedAt: started,
          transientLoaded: false,
          stableLoaded: false,
        };
        requestAnimationFrame(() => {
          const perf = uploadPerfRef.current;
          if (!perf || perf.sequence !== sequence) return;
          console.info(
            `[upload-perf][e2e] preview-state-committed nodeId=${id} name="${file.name}" elapsed=${Math.round(performance.now() - started)}ms`
          );
        });

        try {
          const prepared = await prepareNodeImageFromFile(file);
          const nextData: Partial<UploadImageNodeData> = {
            imageUrl: prepared.imageUrl,
            previewImageUrl: prepared.previewImageUrl,
            aspectRatio: prepared.aspectRatio || '1:1',
            sourceFileName: file.name,
            mediaType: 'image',
            videoUrl: null,
            audioUrl: null,
          };
          if (useUploadFilenameAsNodeTitle) nextData.displayName = file.name;
          updateNodeData(id, nextData);
          console.info(
            `[upload-perf][node] processFile success nodeId=${id} name="${file.name}" size=${file.size}B elapsed=${Math.round(performance.now() - started)}ms`
          );
        } catch (error) {
          if (uploadSequenceRef.current === sequence) clearTransientPreview();
          console.error(
            `[upload-perf][node] processFile failed nodeId=${id} name="${file.name}" size=${file.size}B elapsed=${Math.round(performance.now() - started)}ms`,
            error
          );
          throw error;
        }
        return;
      }

      clearTransientPreview();
      const tauriPath = (file as File & { path?: string }).path ?? '';
      const mediaUrl = tauriPath.length > 0 ? tauriPath : URL.createObjectURL(file);

      if (category === 'video') {
        const nextData: Partial<UploadImageNodeData> = {
          videoUrl: mediaUrl,
          imageUrl: null,
          previewImageUrl: null,
          mediaType: 'video',
          aspectRatio: '16:9',
          sourceFileName: file.name,
        };
        if (useUploadFilenameAsNodeTitle) nextData.displayName = file.name;
        updateNodeData(id, nextData);
        setVideoDuration(0);
        setCurrentTime(0);
      } else {
        const nextData: Partial<UploadImageNodeData> = {
          audioUrl: mediaUrl,
          imageUrl: null,
          previewImageUrl: null,
          mediaType: 'audio',
          sourceFileName: file.name,
        };
        if (useUploadFilenameAsNodeTitle) nextData.displayName = file.name;
        updateNodeData(id, nextData);
      }
    },
    [clearTransientPreview, id, updateNodeData, useUploadFilenameAsNodeTitle]
  );

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const perf = uploadPerfRef.current;
    if (!perf) return;

    const displayedSrc = event.currentTarget.currentSrc || event.currentTarget.src || '';
    const isTransient = displayedSrc.startsWith('blob:');
    const now = performance.now();

    if (isTransient && !perf.transientLoaded) {
      perf.transientLoaded = true;
      console.info(
        `[upload-perf][e2e] first-visible transient nodeId=${id} name="${perf.name}" size=${perf.size}B elapsed=${Math.round(now - perf.startedAt)}ms`
      );
      requestAnimationFrame(() => {
        const nextPerf = uploadPerfRef.current;
        if (!nextPerf || nextPerf.sequence !== perf.sequence) return;
        console.info(
          `[upload-perf][e2e] first-painted transient nodeId=${id} name="${nextPerf.name}" elapsed=${Math.round(performance.now() - nextPerf.startedAt)}ms`
        );
      });
      return;
    }

    if (!isTransient && !perf.stableLoaded) {
      perf.stableLoaded = true;
      console.info(
        `[upload-perf][e2e] stable-visible nodeId=${id} name="${perf.name}" size=${perf.size}B elapsed=${Math.round(now - perf.startedAt)}ms`
      );
      if (uploadSequenceRef.current === perf.sequence) clearTransientPreview();
      requestAnimationFrame(() => {
        const nextPerf = uploadPerfRef.current;
        if (!nextPerf || nextPerf.sequence !== perf.sequence) return;
        console.info(
          `[upload-perf][e2e] stable-painted nodeId=${id} name="${nextPerf.name}" elapsed=${Math.round(performance.now() - nextPerf.startedAt)}ms`
        );
      });
    }
  }, [clearTransientPreview, id]);

  const handleVideoLoadedMetadata = useCallback((event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setVideoDuration(video.duration || 0);
    if (video.videoWidth && video.videoHeight) {
      updateNodeData(id, { aspectRatio: reduceAspectRatio(video.videoWidth, video.videoHeight) });
    }
  }, [id, updateNodeData]);

  const handleScrub = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const time = Number(event.target.value);
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
        : '16:9';
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
  }, [addEdgeToStore, addNode, findNodePosition, id]);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = resolveDroppedMediaFile(event);
      if (!file || !resolveMediaCategory(file)) return;
      await processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !resolveMediaCategory(file)) return;
      await processFile(file);
      event.target.value = '';
    },
    [processFile]
  );

  useEffect(() => {
    return canvasEventBus.subscribe('upload-node/reupload', ({ nodeId }) => {
      if (nodeId !== id) return;
      inputRef.current?.click();
    });
  }, [id]);

  useEffect(() => {
    return canvasEventBus.subscribe('upload-node/paste-image', ({ nodeId, file }) => {
      if (nodeId !== id || !file.type.startsWith('image/')) return;
      void processFile(file);
    });
  }, [id, processFile]);

  const hasMedia = Boolean(data.imageUrl || data.videoUrl || data.audioUrl || transientPreviewUrl);

  const handleNodeClick = useCallback(() => {
    setSelectedNode(id);
    if (!hasMedia) {
      inputRef.current?.click();
    }
  }, [hasMedia, id, setSelectedNode]);

  useEffect(() => () => {
    uploadPerfRef.current = null;
    clearTransientPreview();
  }, [clearTransientPreview]);

  const imageSource = useMemo(() => {
    if (transientPreviewUrl) return transientPreviewUrl;
    const preferOriginal = shouldUseOriginalImageByZoom(zoom);
    const picked = preferOriginal
      ? data.imageUrl || data.previewImageUrl
      : data.previewImageUrl || data.imageUrl;
    return picked ? resolveImageDisplayUrl(picked) : null;
  }, [data.imageUrl, data.previewImageUrl, transientPreviewUrl, zoom]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, resolvedHeight, resolvedWidth, updateNodeInternals]);

  return (
    <div
      className={`
        group relative overflow-visible rounded-[var(--node-radius)] border bg-surface-dark/85 p-0 transition-colors duration-150
        ${selected
          ? 'border-accent shadow-[0_0_0_1px_rgba(59,130,246,0.32)]'
          : 'border-[rgba(15,23,42,0.22)] hover:border-[rgba(15,23,42,0.34)] dark:border-[rgba(255,255,255,0.22)] dark:hover:border-[rgba(255,255,255,0.34)]'}
      `}
      style={{ width: resolvedWidth, height: resolvedHeight }}
      onClick={handleNodeClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <NodeHeader
        className={NODE_HEADER_FLOATING_POSITION_CLASS}
        icon={mediaType === 'video' ? <Video className="h-4 w-4" /> : mediaType === 'audio' ? <Music className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        titleText={resolvedTitle}
        editable
        onTitleChange={(nextTitle) => updateNodeData(id, { displayName: nextTitle })}
      />

      {mediaType === 'video' && data.videoUrl ? (
        <div className="relative h-full w-full overflow-hidden rounded-[var(--node-radius)] bg-bg-dark">
          <video
            ref={videoRef}
            src={resolveImageDisplayUrl(data.videoUrl)}
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
              {`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`}
            </span>
            <button
              className="shrink-0 rounded bg-white/20 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/35"
              onClick={captureFrame}
            >
              {t('node.upload.captureFrame', '截帧')}
            </button>
          </div>
        </div>
      ) : mediaType === 'audio' && data.audioUrl ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[var(--node-radius)] bg-bg-dark px-3">
          <Music className="h-7 w-7 text-text-muted/60" />
          <audio
            src={resolveImageDisplayUrl(data.audioUrl)}
            controls
            className="w-full"
            onMouseDown={(e) => e.stopPropagation()}
          />
          {data.sourceFileName && (
            <span className="w-full truncate text-center text-[11px] text-text-muted">
              {data.sourceFileName}
            </span>
          )}
        </div>
      ) : (data.imageUrl || transientPreviewUrl) ? (
        <div
          className="block h-full w-full overflow-hidden rounded-[var(--node-radius)] bg-bg-dark"
        >
          <CanvasNodeImage
            src={imageSource ?? ''}
            viewerSourceUrl={data.imageUrl ? resolveImageDisplayUrl(data.imageUrl) : null}
            alt={t('node.upload.uploadedAlt')}
            className="h-full w-full object-contain"
            onLoad={handleImageLoad}
          />
        </div>
      ) : (
        <label
          className="block h-full w-full overflow-hidden rounded-[var(--node-radius)] bg-bg-dark"
        >
          <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-text-muted/85">
            <Upload className="h-7 w-7 opacity-60" />
            <span className="px-3 text-center text-[12px] leading-6">{t('node.upload.hint')}</span>
          </div>
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Handle
        type="source"
        id="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-surface-dark !bg-accent"
      />
      <NodeResizeHandle
        minWidth={resizeMinWidth}
        minHeight={resizeMinHeight}
        maxWidth={1400}
        maxHeight={1400}
      />
    </div>
  );
});

UploadNode.displayName = 'UploadNode';
