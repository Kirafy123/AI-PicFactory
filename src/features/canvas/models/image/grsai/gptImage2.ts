import type { ImageModelDefinition } from '../../types';
import { createGrsaiPointsPricing } from '@/features/canvas/pricing';

const ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '5:4',
  '4:5',
  '21:9',
] as const;

export const imageModel: ImageModelDefinition = {
  id: 'grsai/gpt-image-2',
  mediaType: 'image',
  displayName: 'GPT Image 2',
  providerId: 'grsai',
  description: 'GPT Image 2 图像生成',
  eta: '30s',
  expectedDurationMs: 30000,
  defaultAspectRatio: '1:1',
  defaultResolution: '1K',
  aspectRatios: ASPECT_RATIOS.map((value) => ({ value, label: value })),
  resolutions: [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
  ],
  pricing: createGrsaiPointsPricing(() => 650),
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: 'grsai/gpt-image-2',
    modeLabel: referenceImageCount > 0 ? '编辑模式' : '生成模式',
  }),
};
