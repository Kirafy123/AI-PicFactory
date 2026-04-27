import type { VideoModelDefinition } from '../../types';

export const DASHSCOPE_WAN27_T2V_MODEL_ID = 'dashscope/wan2.7-t2v';

export const videoModel: VideoModelDefinition = {
  id: DASHSCOPE_WAN27_T2V_MODEL_ID,
  mediaType: 'video',
  displayName: 'Wan 2.7 T2V (万相视频)',
  providerId: 'dashscope',
  description: '万相视频 · Wan2.7 文生视频',
  eta: '3-5min',
  expectedDurationMs: 240000,
  defaultAspectRatio: '16:9',
  defaultResolution: '720P',
  durationRange: { min: 5, max: 15, step: 1, default: 10 },
  aspectRatios: [
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
  ],
  resolutions: [
    { value: '720P', label: '720P' },
    { value: '1080P', label: '1080P' },
  ],
  extraParamsSchema: [
    {
      key: 'prompt_extend',
      label: 'Prompt Extend',
      labelKey: 'videoParams.promptExtend',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'watermark',
      label: 'Watermark',
      labelKey: 'videoParams.watermark',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  supportsFirstFrame: false,
  resolveRequest: () => ({
    requestModel: DASHSCOPE_WAN27_T2V_MODEL_ID,
    modeLabel: '文生视频',
  }),
};
