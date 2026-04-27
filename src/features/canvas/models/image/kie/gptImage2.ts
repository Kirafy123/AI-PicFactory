import type { ImageModelDefinition } from '../../types';
import { createFixedResolutionPricing } from '@/features/canvas/pricing';

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
  id: 'kie/gpt-image-2',
  mediaType: 'image',
  displayName: 'GPT Image 2 (KIE)',
  providerId: 'kie',
  description: 'KIE · GPT Image 2 图像生成与编辑',
  eta: '30s',
  expectedDurationMs: 30000,
  defaultAspectRatio: '1:1',
  defaultResolution: '1K',
  aspectRatios: ASPECT_RATIOS.map((value) => ({ value, label: value })),
  resolutions: [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ],
  pricing: createFixedResolutionPricing({
    currency: 'USD',
    standardRates: {
      '1K': 0.04,
      '2K': 0.08,
      '4K': 0.16,
    },
    discountedRates: {
      '1K': 0.04,
      '2K': 0.08,
      '4K': 0.16,
    },
  }),
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: referenceImageCount > 0 ? 'kie/gpt-image-2-image-to-image' : 'kie/gpt-image-2-text-to-image',
    modeLabel: referenceImageCount > 0 ? '编辑模式' : '生成模式',
  }),
};
