import type { VideoModelDefinition } from '../../types';

export const KIE_SEEDANCE_2_MODEL_ID = 'kie/seedance-2';

export const videoModel: VideoModelDefinition = {
  id: KIE_SEEDANCE_2_MODEL_ID,
  mediaType: 'video',
  displayName: 'Seedance 2 (KIE)',
  providerId: 'kie',
  description: 'KIE · Seedance 2.0 高质量视频生成，支持多模态输入',
  eta: '4-6min',
  expectedDurationMs: 300000,
  defaultAspectRatio: '16:9',
  defaultResolution: '720p',
  durationRange: { min: 4, max: 15, step: 1, default: 5 },
  aspectRatios: [
    { value: '16:9', label: '16:9' },
    { value: '4:3', label: '4:3' },
    { value: '1:1', label: '1:1' },
    { value: '3:4', label: '3:4' },
    { value: '9:16', label: '9:16' },
    { value: '21:9', label: '21:9' },
  ],
  resolutions: [
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
  ],
  supportsFirstFrame: true,
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: KIE_SEEDANCE_2_MODEL_ID,
    modeLabel: referenceImageCount > 0 ? '图生视频' : '文生视频',
  }),
};
