import type { VideoModelDefinition } from '../../types';

export const DASHSCOPE_HAPPYHORSE_R2V_MODEL_ID = 'dashscope/happyhorse-1.0-r2v';

export const videoModel: VideoModelDefinition = {
  id: DASHSCOPE_HAPPYHORSE_R2V_MODEL_ID,
  mediaType: 'video',
  displayName: 'HappyHorse R2V (万相视频)',
  providerId: 'dashscope',
  description: '万相视频 · HappyHorse 参考生视频，支持多张参考图融合生成视频',
  eta: '1-5min',
  expectedDurationMs: 180000,
  defaultAspectRatio: '16:9',
  defaultResolution: '1080P',
  durationRange: { min: 3, max: 15, step: 1, default: 5 },
  aspectRatios: [
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
    { value: '1:1', label: '1:1' },
    { value: '4:5', label: '4:5' },
    { value: '5:4', label: '5:4' },
  ],
  resolutions: [
    { value: '720P', label: '720P' },
    { value: '1080P', label: '1080P' },
  ],
  extraParamsSchema: [
    {
      key: 'watermark',
      label: 'Watermark',
      labelKey: 'videoParams.watermark',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  supportsFirstFrame: false,
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: 'happyhorse-1.0-r2v',
    modeLabel: referenceImageCount > 0 ? '参考生视频' : '文生视频',
  }),
};
