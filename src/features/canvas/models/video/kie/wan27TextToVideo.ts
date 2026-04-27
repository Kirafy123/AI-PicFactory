import type { VideoModelDefinition } from '../../types';

export const KIE_WAN_27_T2V_MODEL_ID = 'kie/wan-2-7-t2v';

export const videoModel: VideoModelDefinition = {
  id: KIE_WAN_27_T2V_MODEL_ID,
  mediaType: 'video',
  displayName: 'Wan 2.7 T2V (KIE)',
  providerId: 'kie',
  description: 'KIE · Wan 2.7 文生视频，纯文本提示词驱动',
  eta: '3-5min',
  expectedDurationMs: 240000,
  defaultAspectRatio: '16:9',
  defaultResolution: '720p',
  durationRange: { min: 5, max: 10, step: 1, default: 5 },
  aspectRatios: [
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
  ],
  resolutions: [
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
  ],
  extraParamsSchema: [
    {
      key: 'prompt_extend',
      label: 'Prompt Extend',
      labelKey: 'videoParams.promptExtend',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  supportsFirstFrame: false,
  resolveRequest: () => ({
    requestModel: KIE_WAN_27_T2V_MODEL_ID,
    modeLabel: '文生视频',
  }),
};
