import {
  type KeyboardEvent,
  type ReactNode,
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { Video, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CANVAS_NODE_TYPES,
  EXPORT_RESULT_NODE_DEFAULT_WIDTH,
  EXPORT_RESULT_NODE_LAYOUT_HEIGHT,
  type VideoGenNodeData,
} from '@/features/canvas/domain/canvasNodes';
import { resolveNodeDisplayName } from '@/features/canvas/domain/nodeDisplay';
import { NodeHeader, NODE_HEADER_FLOATING_POSITION_CLASS } from '@/features/canvas/ui/NodeHeader';
import { PromptStyleTagBar } from '@/features/canvas/ui/PromptStyleTagBar';
import { NodeResizeHandle } from '@/features/canvas/ui/NodeResizeHandle';
import {
  canvasAiGateway,
  graphImageResolver,
} from '@/features/canvas/application/canvasServices';
import { resolveErrorContent, showErrorDialog } from '@/features/canvas/application/errorDialog';
import {
  resolveImageDisplayUrl,
} from '@/features/canvas/application/imageData';
import {
  CURRENT_RUNTIME_SESSION_ID,
  getRuntimeDiagnostics,
  type GenerationDebugContext,
} from '@/features/canvas/application/generationErrorReport';
import {
  findReferenceTokens,
  insertReferenceToken,
  removeTextRange,
  resolveReferenceAwareDeleteRange,
} from '@/features/canvas/application/referenceTokenEditing';
import {
  DEFAULT_VIDEO_MODEL_ID,
  getVideoModel,
  listVideoModels,
} from '@/features/canvas/models/registry';
import {
  NODE_CONTROL_CHIP_CLASS,
  NODE_CONTROL_ICON_CLASS,
  NODE_CONTROL_PRIMARY_BUTTON_CLASS,
} from '@/features/canvas/ui/nodeControlStyles';
import { CanvasNodeImage } from '@/features/canvas/ui/CanvasNodeImage';
import { UiButton } from '@/components/ui';
import { useCanvasStore } from '@/stores/canvasStore';
import { useSettingsStore } from '@/stores/settingsStore';

type VideoGenNodeProps = NodeProps & {
  id: string;
  data: VideoGenNodeData;
  selected?: boolean;
};

interface PickerAnchor {
  left: number;
  top: number;
}

const PICKER_FALLBACK_ANCHOR: PickerAnchor = { left: 8, top: 8 };
const PICKER_Y_OFFSET_PX = 20;
const VIDEO_GEN_NODE_MIN_WIDTH = 390;
const VIDEO_GEN_NODE_MIN_HEIGHT = 260;
const VIDEO_GEN_NODE_MAX_WIDTH = 1400;
const VIDEO_GEN_NODE_MAX_HEIGHT = 1000;
const VIDEO_GEN_NODE_DEFAULT_WIDTH = 520;
const VIDEO_GEN_NODE_DEFAULT_HEIGHT = 420;

function getTextareaCaretOffset(
  textarea: HTMLTextAreaElement,
  caretIndex: number
): PickerAnchor {
  const mirror = document.createElement('div');
  const computed = window.getComputedStyle(textarea);
  const mirrorStyle = mirror.style;
  mirrorStyle.position = 'absolute';
  mirrorStyle.visibility = 'hidden';
  mirrorStyle.pointerEvents = 'none';
  mirrorStyle.whiteSpace = 'pre-wrap';
  mirrorStyle.overflowWrap = 'break-word';
  mirrorStyle.wordBreak = 'break-word';
  mirrorStyle.boxSizing = computed.boxSizing;
  mirrorStyle.width = `${textarea.clientWidth}px`;
  mirrorStyle.font = computed.font;
  mirrorStyle.lineHeight = computed.lineHeight;
  mirrorStyle.letterSpacing = computed.letterSpacing;
  mirrorStyle.padding = computed.padding;
  mirrorStyle.border = computed.border;
  mirror.textContent = textarea.value.slice(0, caretIndex);
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(caretIndex, caretIndex + 1) || ' ';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const left = marker.offsetLeft - textarea.scrollLeft;
  const top = marker.offsetTop - textarea.scrollTop;
  document.body.removeChild(mirror);
  return { left: Math.max(0, left), top: Math.max(0, top) };
}

function resolvePickerAnchor(
  container: HTMLDivElement | null,
  textarea: HTMLTextAreaElement,
  caretIndex: number
): PickerAnchor {
  if (!container) return PICKER_FALLBACK_ANCHOR;
  const containerRect = container.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();
  const caretOffset = getTextareaCaretOffset(textarea, caretIndex);
  return {
    left: Math.max(0, textareaRect.left - containerRect.left + caretOffset.left),
    top: Math.max(0, textareaRect.top - containerRect.top + caretOffset.top + PICKER_Y_OFFSET_PX),
  };
}

function renderPromptWithHighlights(prompt: string, maxImageCount: number): ReactNode {
  if (!prompt) return ' ';
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  const referenceTokens = findReferenceTokens(prompt, maxImageCount);
  for (const token of referenceTokens) {
    if (token.start > lastIndex) {
      segments.push(<span key={`plain-${lastIndex}`}>{prompt.slice(lastIndex, token.start)}</span>);
    }
    segments.push(
      <span
        key={`ref-${token.start}`}
        className="relative z-0 text-white [text-shadow:0.24px_0_currentColor,-0.24px_0_currentColor] before:absolute before:-inset-x-[4px] before:-inset-y-[1px] before:-z-10 before:rounded-[7px] before:bg-accent/55 before:content-['']"
      >
        {token.token}
      </span>
    );
    lastIndex = token.start + token.token.length;
  }
  if (lastIndex < prompt.length) {
    segments.push(<span key={`plain-${lastIndex}`}>{prompt.slice(lastIndex)}</span>);
  }
  return segments;
}

export const VideoGenNode = memo(({ id, data, selected, width, height }: VideoGenNodeProps) => {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const [error, setError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const promptHighlightRef = useRef<HTMLDivElement>(null);
  const [promptDraft, setPromptDraft] = useState(() => data.prompt ?? '');
  const promptDraftRef = useRef(promptDraft);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickerCursor, setPickerCursor] = useState<number | null>(null);
  const [pickerActiveIndex, setPickerActiveIndex] = useState(0);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor>(PICKER_FALLBACK_ANCHOR);

  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const setSelectedNode = useCanvasStore((state) => state.setSelectedNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const addNode = useCanvasStore((state) => state.addNode);
  const findNodePosition = useCanvasStore((state) => state.findNodePosition);
  const addEdge = useCanvasStore((state) => state.addEdge);
  const apiKeys = useSettingsStore((state) => state.apiKeys);

  const resolvedWidth = (typeof width === 'number' && width > 1) ? Math.round(width) : VIDEO_GEN_NODE_DEFAULT_WIDTH;
  const resolvedHeight = (typeof height === 'number' && height > 1) ? Math.round(height) : VIDEO_GEN_NODE_DEFAULT_HEIGHT;

  const resolvedTitle = useMemo(
    () => resolveNodeDisplayName(CANVAS_NODE_TYPES.videoGen, data),
    [data]
  );

  const incomingImages = useMemo(
    () => graphImageResolver.collectInputImages(id, nodes, edges),
    [id, nodes, edges]
  );

  const incomingImageItems = useMemo(
    () => incomingImages.map((imageUrl, index) => ({
      imageUrl,
      displayUrl: resolveImageDisplayUrl(imageUrl),
      label: `图${index + 1}`,
    })),
    [incomingImages]
  );

  const videoModels = useMemo(() => listVideoModels(), []);

  const selectedModel = useMemo(() => {
    return getVideoModel(data.model ?? DEFAULT_VIDEO_MODEL_ID);
  }, [data.model]);

  const providerApiKey = apiKeys[selectedModel.providerId] ?? '';

  const selectedResolution = useMemo(
    () => selectedModel.resolutions.find((r) => r.value === data.resolution) ?? selectedModel.resolutions[0],
    [data.resolution, selectedModel]
  );

  const selectedAspectRatio = useMemo(
    () => selectedModel.aspectRatios.find((r) => r.value === data.requestAspectRatio) ?? selectedModel.aspectRatios[0],
    [data.requestAspectRatio, selectedModel]
  );

  const duration = data.duration ?? selectedModel.durationRange.default;

  useEffect(() => { promptDraftRef.current = promptDraft; }, [promptDraft]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, resolvedHeight, resolvedWidth, updateNodeInternals]);

  // Auto-select first image as default first frame when images are connected
  useEffect(() => {
    if (selectedModel.supportsFirstFrame && incomingImages.length > 0 && !data.firstFrameImageUrl) {
      updateNodeData(id, { firstFrameImageUrl: incomingImages[0] });
    }
  }, [selectedModel.supportsFirstFrame, incomingImages, data.firstFrameImageUrl, id, updateNodeData]);

  const commitPromptDraft = useCallback(
    (value: string) => { updateNodeData(id, { prompt: value }); },
    [id, updateNodeData]
  );

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!showImagePicker) return;
      if (rootRef.current?.contains(event.target as Node)) return;
      setShowImagePicker(false);
      setPickerCursor(null);
    };
    document.addEventListener('mousedown', handleOutside, true);
    return () => { document.removeEventListener('mousedown', handleOutside, true); };
  }, [showImagePicker]);

  const handleGenerate = useCallback(async () => {
    const prompt = promptDraft.replace(/@(?=图\d+)/g, '').trim();
    if (!prompt) {
      const errorMessage = t('node.videoGen.promptRequired', '请输入视频描述');
      setError(errorMessage);
      void showErrorDialog(errorMessage, t('common.error'));
      return;
    }
    if (!providerApiKey) {
      const errorMessage = t('node.videoGen.apiKeyRequired', '请先配置 API Key');
      setError(errorMessage);
      void showErrorDialog(errorMessage, t('common.error'));
      return;
    }

    // Check if first frame is required for I2V models
    const isImageToVideoModel = selectedModel.id.includes('i2v') || selectedModel.id.includes('image-to-video');
    if (isImageToVideoModel && selectedModel.supportsFirstFrame) {
      if (incomingImages.length === 0) {
        const errorMessage = t('node.videoGen.firstFrameRequired', '图生视频模型需要连接图片节点作为首帧');
        setError(errorMessage);
        void showErrorDialog(errorMessage, t('common.error'));
        return;
      }
    }

    // Check if reference images are required for R2V models
    const isReferenceToVideoModel = selectedModel.id.includes('r2v') || selectedModel.id.includes('reference-to-video');
    if (isReferenceToVideoModel && incomingImages.length === 0) {
      const errorMessage = t('node.videoGen.referenceImagesRequired', '参考生视频模型需要连接图片节点作为参考图');
      setError(errorMessage);
      void showErrorDialog(errorMessage, t('common.error'));
      return;
    }

    // Extract referenced images from prompt
    const referenceTokens = findReferenceTokens(promptDraft, incomingImages.length);
    const referencedImages: string[] = [];
    for (const token of referenceTokens) {
      const imageIndex = token.value - 1;
      if (imageIndex >= 0 && imageIndex < incomingImages.length) {
        referencedImages.push(incomingImages[imageIndex]);
      }
    }

    const generationDurationMs = selectedModel.expectedDurationMs ?? 300000;
    const generationStartedAt = Date.now();
    const runtimeDiagnostics = await getRuntimeDiagnostics();
    setError(null);

    const newNodePosition = findNodePosition(
      id,
      EXPORT_RESULT_NODE_DEFAULT_WIDTH,
      EXPORT_RESULT_NODE_LAYOUT_HEIGHT
    );
    const newNodeId = addNode(
      CANVAS_NODE_TYPES.exportVideo,
      newNodePosition,
      {
        isGenerating: true,
        generationStartedAt,
        generationDurationMs,
        displayName: prompt.slice(0, 40),
        aspectRatio: selectedAspectRatio.value,
        duration,
      }
    );
    addEdge(id, newNodeId);

    try {
      await canvasAiGateway.setApiKey(selectedModel.providerId, providerApiKey);

      const extraParams: Record<string, unknown> = {
        ...(data.extraParams ?? {}),
        video_duration: duration,
        video_resolution: selectedResolution.value,
      };

      // Only include first_frame_url if it's valid and still in incoming images
      if (data.firstFrameImageUrl && selectedModel.supportsFirstFrame) {
        // Verify the firstFrameImageUrl is still valid (exists in current incoming images)
        if (incomingImages.includes(data.firstFrameImageUrl)) {
          extraParams.first_frame_url = data.firstFrameImageUrl;
        } else if (incomingImages.length > 0) {
          // Fallback to first incoming image if stored firstFrameImageUrl is stale
          extraParams.first_frame_url = incomingImages[0];
          // Update the stored value to the current first image
          updateNodeData(id, { firstFrameImageUrl: incomingImages[0] });
        }
      }

      const requestModel = selectedModel.resolveRequest({
        referenceImageCount: referencedImages.length,
      }).requestModel;

      const jobId = await canvasAiGateway.submitGenerateImageJob({
        prompt,
        model: requestModel,
        size: selectedResolution.value,
        aspectRatio: selectedAspectRatio.value,
        referenceImages: referencedImages.length > 0 ? referencedImages : undefined,
        extraParams,
      });

      const generationDebugContext: GenerationDebugContext = {
        sourceType: 'videoGen',
        providerId: selectedModel.providerId,
        requestModel,
        requestSize: selectedResolution.value,
        requestAspectRatio: selectedAspectRatio.value,
        prompt,
        extraParams,
        referenceImageCount: referencedImages.length,
        referenceImagePlaceholders: [],
        appVersion: runtimeDiagnostics.appVersion,
        osName: runtimeDiagnostics.osName,
        osVersion: runtimeDiagnostics.osVersion,
        osBuild: runtimeDiagnostics.osBuild,
        userAgent: runtimeDiagnostics.userAgent,
      };
      updateNodeData(newNodeId, {
        generationJobId: jobId,
        generationSourceType: 'videoGen',
        generationProviderId: selectedModel.providerId,
        generationClientSessionId: CURRENT_RUNTIME_SESSION_ID,
        generationDebugContext,
      });
    } catch (generationError) {
      const resolvedError = resolveErrorContent(generationError, t('ai.error'));
      setError(resolvedError.message);
      void showErrorDialog(resolvedError.message, t('common.error'), resolvedError.details);
      updateNodeData(newNodeId, {
        isGenerating: false,
        generationStartedAt: null,
        generationJobId: null,
        generationError: resolvedError.message,
        generationErrorDetails: resolvedError.details ?? null,
      });
    }
  }, [
    addNode, addEdge, providerApiKey, findNodePosition, promptDraft,
    data.extraParams, data.firstFrameImageUrl, incomingImages,
    id, selectedModel, selectedAspectRatio.value, selectedResolution.value,
    duration, t, updateNodeData,
  ]);

  const syncPromptHighlightScroll = () => {
    if (!promptRef.current || !promptHighlightRef.current) return;
    promptHighlightRef.current.scrollTop = promptRef.current.scrollTop;
    promptHighlightRef.current.scrollLeft = promptRef.current.scrollLeft;
  };

  const appendStyleTagPrompt = useCallback((promptText: string) => {
    const current = promptDraftRef.current;
    const next = current + promptText;
    setPromptDraft(next);
    commitPromptDraft(next);
    requestAnimationFrame(() => {
      if (promptRef.current) {
        promptRef.current.focus();
        promptRef.current.setSelectionRange(next.length, next.length);
      }
    });
  }, [commitPromptDraft]);

  const insertImageReference = useCallback((imageIndex: number) => {
    const marker = `@图${imageIndex + 1}`;
    const currentPrompt = promptDraftRef.current;
    const cursor = pickerCursor ?? currentPrompt.length;
    const { nextText, nextCursor } = insertReferenceToken(currentPrompt, cursor, marker);
    setPromptDraft(nextText);
    commitPromptDraft(nextText);
    setShowImagePicker(false);
    setPickerCursor(null);
    setPickerActiveIndex(0);
    requestAnimationFrame(() => {
      promptRef.current?.focus();
      promptRef.current?.setSelectionRange(nextCursor, nextCursor);
      syncPromptHighlightScroll();
    });
  }, [commitPromptDraft, pickerCursor]);

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const currentPrompt = promptDraftRef.current;
      const selectionStart = event.currentTarget.selectionStart ?? currentPrompt.length;
      const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart;
      const direction = event.key === 'Backspace' ? 'backward' : 'forward';
      const deleteRange = resolveReferenceAwareDeleteRange(currentPrompt, selectionStart, selectionEnd, direction, incomingImages.length);
      if (deleteRange) {
        event.preventDefault();
        const { nextText, nextCursor } = removeTextRange(currentPrompt, deleteRange);
        setPromptDraft(nextText);
        commitPromptDraft(nextText);
        requestAnimationFrame(() => {
          promptRef.current?.focus();
          promptRef.current?.setSelectionRange(nextCursor, nextCursor);
          syncPromptHighlightScroll();
        });
        return;
      }
    }
    if (showImagePicker && incomingImages.length > 0) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setPickerActiveIndex((p) => (p + 1) % incomingImages.length); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); setPickerActiveIndex((p) => p === 0 ? incomingImages.length - 1 : p - 1); return; }
      if (event.key === 'Enter') { event.preventDefault(); insertImageReference(pickerActiveIndex); return; }
    }
    if (event.key === '@' && incomingImages.length > 0) {
      event.preventDefault();
      const cursor = event.currentTarget.selectionStart ?? promptDraftRef.current.length;
      setPickerAnchor(resolvePickerAnchor(rootRef.current, event.currentTarget, cursor));
      setPickerCursor(cursor);
      setShowImagePicker(true);
      setPickerActiveIndex(0);
      return;
    }
    if (event.key === 'Escape' && showImagePicker) {
      event.preventDefault(); setShowImagePicker(false); setPickerCursor(null); setPickerActiveIndex(0); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault(); void handleGenerate();
    }
  };

  return (
    <div
      ref={rootRef}
      className={`
        group relative flex h-full flex-col overflow-visible rounded-[var(--node-radius)] border bg-surface-dark/90 p-2 transition-colors duration-150
        ${selected
          ? 'border-accent shadow-[0_0_0_1px_rgba(59,130,246,0.32)]'
          : 'border-[rgba(15,23,42,0.22)] hover:border-[rgba(15,23,42,0.34)] dark:border-[rgba(255,255,255,0.22)] dark:hover:border-[rgba(255,255,255,0.34)]'}
      `}
      style={{ width: `${resolvedWidth}px`, height: `${resolvedHeight}px` }}
      onClick={() => setSelectedNode(id)}
    >
      <NodeHeader
        className={NODE_HEADER_FLOATING_POSITION_CLASS}
        icon={<Video className="h-4 w-4" />}
        titleText={resolvedTitle}
        editable
        onTitleChange={(nextTitle) => updateNodeData(id, { displayName: nextTitle })}
      />

      <PromptStyleTagBar onTagClick={appendStyleTagPrompt} />

      {/* First Frame Selector */}
      {selectedModel.supportsFirstFrame && (
        <div className="mb-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] bg-bg-dark/45 p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] font-medium text-text-muted">{t('node.videoGen.firstFrame', '首帧图片')}</div>
            {incomingImages.length > 0 && (
              <div className="text-[10px] text-text-muted/60">{t('node.videoGen.clickToSelect', '点击选择')}</div>
            )}
          </div>
          {incomingImages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {incomingImageItems.map((item, index) => {
                const isSelected = data.firstFrameImageUrl === item.imageUrl;
                return (
                  <button
                    key={`${item.imageUrl}-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNodeData(id, {
                        firstFrameImageUrl: isSelected ? null : item.imageUrl,
                      });
                    }}
                    className={`nodrag nowheel relative h-12 w-12 overflow-hidden rounded border-2 transition-all ${
                      isSelected
                        ? 'border-accent shadow-[0_0_0_1px_rgba(59,130,246,0.4)] opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80 hover:border-[rgba(255,255,255,0.3)]'
                    }`}
                  >
                    <CanvasNodeImage
                      src={item.displayUrl}
                      alt={item.label}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
                        <div className="flex flex-col items-center gap-0.5">
                          <ImageIcon className="h-3 w-3 text-white" />
                          <span className="text-[9px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {t('node.videoGen.firstFrameLabel', '首帧')}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-text-muted/60">{t('node.videoGen.noFirstFrame', '连接图片节点以选择首帧')}</div>
          )}
        </div>
      )}

      {/* Prompt area */}
      <div className="relative min-h-0 flex-1 rounded-lg border border-[rgba(255,255,255,0.1)] bg-bg-dark/45 p-2">
        <div className="relative h-full min-h-0">
          <div
            ref={promptHighlightRef}
            aria-hidden="true"
            className="ui-scrollbar pointer-events-none absolute inset-0 overflow-y-auto overflow-x-hidden text-sm leading-6 text-text-dark"
            style={{ scrollbarGutter: 'stable' }}
          >
            <div className="min-h-full whitespace-pre-wrap break-words px-1 py-0.5">
              {renderPromptWithHighlights(promptDraft, incomingImages.length)}
            </div>
          </div>
          <textarea
            ref={promptRef}
            value={promptDraft}
            onChange={(event) => {
              const nextValue = event.target.value;
              setPromptDraft(nextValue);
              commitPromptDraft(nextValue);
            }}
            onKeyDown={handlePromptKeyDown}
            onScroll={syncPromptHighlightScroll}
            onMouseDown={(event) => event.stopPropagation()}
            placeholder={t('node.videoGen.promptPlaceholder', '描述你想生成的视频内容...')}
            className="ui-scrollbar nodrag nowheel relative z-10 h-full w-full resize-none overflow-y-auto overflow-x-hidden border-none bg-transparent px-1 py-0.5 text-sm leading-6 text-transparent caret-text-dark outline-none placeholder:text-text-muted/80 focus:border-transparent whitespace-pre-wrap break-words"
            style={{ scrollbarGutter: 'stable' }}
          />
        </div>

        {showImagePicker && incomingImageItems.length > 0 && (
          <div
            className="nowheel absolute z-30 w-[120px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.16)] bg-surface-dark shadow-xl"
            style={{ left: pickerAnchor.left, top: pickerAnchor.top }}
            onMouseDown={(e) => e.stopPropagation()}
            onWheelCapture={(e) => e.stopPropagation()}
          >
            <div className="ui-scrollbar nowheel max-h-[180px] overflow-y-auto" onWheelCapture={(e) => e.stopPropagation()}>
              {incomingImageItems.map((item, index) => (
                <button
                  key={`${item.imageUrl}-${index}`}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); insertImageReference(index); }}
                  onMouseEnter={() => setPickerActiveIndex(index)}
                  className={`flex w-full items-center gap-2 border border-transparent bg-bg-dark/70 px-2 py-2 text-left text-sm text-text-dark transition-colors hover:border-[rgba(255,255,255,0.18)] ${
                    pickerActiveIndex === index ? 'border-[rgba(255,255,255,0.24)] bg-bg-dark' : ''
                  }`}
                >
                  <CanvasNodeImage src={item.displayUrl} alt={item.label} className="h-8 w-8 rounded object-cover" draggable={false} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="mt-2 flex shrink-0 flex-wrap items-center gap-1">
        {/* Model selector */}
        <select
          value={data.model ?? DEFAULT_VIDEO_MODEL_ID}
          onChange={(e) => {
            e.stopPropagation();
            const newModel = getVideoModel(e.target.value);
            updateNodeData(id, {
              model: e.target.value,
              resolution: newModel.defaultResolution,
              requestAspectRatio: newModel.defaultAspectRatio,
              duration: newModel.durationRange.default,
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`nodrag nowheel ${NODE_CONTROL_CHIP_CLASS} rounded-md border border-border-dark bg-bg-dark text-text-dark outline-none`}
        >
          {videoModels.map((m) => (
            <option key={m.id} value={m.id}>{m.displayName}</option>
          ))}
        </select>

        {/* Resolution */}
        <select
          value={data.resolution ?? selectedModel.defaultResolution}
          onChange={(e) => { e.stopPropagation(); updateNodeData(id, { resolution: e.target.value }); }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`nodrag nowheel ${NODE_CONTROL_CHIP_CLASS} rounded-md border border-border-dark bg-bg-dark text-text-dark outline-none`}
        >
          {selectedModel.resolutions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        {/* Aspect ratio */}
        <select
          value={data.requestAspectRatio ?? selectedModel.defaultAspectRatio}
          onChange={(e) => { e.stopPropagation(); updateNodeData(id, { requestAspectRatio: e.target.value }); }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`nodrag nowheel ${NODE_CONTROL_CHIP_CLASS} rounded-md border border-border-dark bg-bg-dark text-text-dark outline-none`}
        >
          {selectedModel.aspectRatios.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        {/* Duration */}
        <div className="nodrag nowheel flex items-center gap-1">
          <input
            type="range"
            min={selectedModel.durationRange.min}
            max={selectedModel.durationRange.max}
            step={selectedModel.durationRange.step}
            value={duration}
            onChange={(e) => { e.stopPropagation(); updateNodeData(id, { duration: Number(e.target.value) }); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-1 w-16 accent-accent"
          />
          <span className="text-[11px] text-text-muted">{duration}s</span>
        </div>

        <div className="ml-auto" />

        <UiButton
          onClick={(event) => { event.stopPropagation(); void handleGenerate(); }}
          variant="primary"
          className={`shrink-0 ${NODE_CONTROL_PRIMARY_BUTTON_CLASS}`}
        >
          <Video className={NODE_CONTROL_ICON_CLASS} strokeWidth={2.8} />
          {t('node.videoGen.generate', '生成视频')}
        </UiButton>
      </div>

      {error && <div className="mt-1 shrink-0 text-xs text-red-400">{error}</div>}

      <Handle type="target" id="target" position={Position.Left} className="!h-2 !w-2 !border-surface-dark !bg-accent" />
      <Handle type="source" id="source" position={Position.Right} className="!h-2 !w-2 !border-surface-dark !bg-accent" />

      <NodeResizeHandle
        minWidth={VIDEO_GEN_NODE_MIN_WIDTH}
        minHeight={VIDEO_GEN_NODE_MIN_HEIGHT}
        maxWidth={VIDEO_GEN_NODE_MAX_WIDTH}
        maxHeight={VIDEO_GEN_NODE_MAX_HEIGHT}
      />
    </div>
  );
});
