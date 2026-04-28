import type { ImageModelDefinition } from '../../types';

const ASPECT_RATIOS = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '2:3',
  '3:2',
  '21:9',
] as const;

export const imageModel: ImageModelDefinition = {
  id: 'kie/seedream/4.5',
  mediaType: 'image',
  displayName: 'Seedream 4.5',
  providerId: 'kie',
  description: 'KIE · Seedream 4.5 文生图 & 图像编辑',
  eta: '30s',
  expectedDurationMs: 30000,
  defaultAspectRatio: '1:1',
  defaultResolution: '2K',
  aspectRatios: ASPECT_RATIOS.map((value) => ({ value, label: value })),
  resolutions: [
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ],
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: referenceImageCount > 0 ? 'kie/seedream/4.5-edit' : 'kie/seedream/4.5-text-to-image',
    modeLabel: referenceImageCount > 0 ? '图像编辑' : '文生图',
  }),
};
