import { memo, useEffect, useMemo, useState } from 'react';
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from '@xyflow/react';
import { AlertTriangle, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  EXPORT_RESULT_NODE_MIN_WIDTH,
  EXPORT_RESULT_NODE_MIN_HEIGHT,
  type CanvasNodeType,
  type ExportVideoNodeData,
} from '@/features/canvas/domain/canvasNodes';
import { resolveNodeDisplayName } from '@/features/canvas/domain/nodeDisplay';
import { NodeHeader, NODE_HEADER_FLOATING_POSITION_CLASS } from '@/features/canvas/ui/NodeHeader';
import { NodeResizeHandle } from '@/features/canvas/ui/NodeResizeHandle';
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

const DEFAULT_WIDTH = 384;
const DEFAULT_HEIGHT = 288;

export const ExportVideoNode = memo(({ id, data, selected, type, width, height }: ExportVideoNodeProps) => {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const setSelectedNode = useCanvasStore((state) => state.setSelectedNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const [now, setNow] = useState(() => Date.now());

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
          <video
            src={data.videoUrl}
            controls
            className="h-full w-full object-contain"
            onMouseDown={(e) => e.stopPropagation()}
          />
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

      <NodeResizeHandle
        minWidth={EXPORT_RESULT_NODE_MIN_WIDTH}
        minHeight={EXPORT_RESULT_NODE_MIN_HEIGHT}
        maxWidth={1600}
        maxHeight={1600}
      />
    </div>
  );
});

ExportVideoNode.displayName = 'ExportVideoNode';
