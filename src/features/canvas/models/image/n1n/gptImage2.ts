import type { ImageModelDefinition } from '../../types';

export const N1N_GPT_IMAGE_2_MODEL_ID = 'n1n/gpt-image-2';

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4K-16:9', label: '4K 16:9' },
  { value: '4K-9:16', label: '4K 9:16' },
];

// Resolution values map directly to N1N size parameter strings
const RESOLUTIONS = [
  { value: '1024x1024', label: '1024×1024 (1:1)' },
  { value: '1536x1024', label: '1536×1024 (3:2)' },
  { value: '1024x1536', label: '1024×1536 (2:3)' },
  { value: '2048x2048', label: '2048×2048 (1:1 HD)' },
  { value: '2048x1152', label: '2048×1152 (16:9)' },
  { value: '3840x2160', label: '3840×2160 (4K 16:9)' },
  { value: '2160x3840', label: '2160×3840 (4K 9:16)' },
];

export const imageModel: ImageModelDefinition = {
  id: N1N_GPT_IMAGE_2_MODEL_ID,
  mediaType: 'image',
  displayName: 'GPT Image 2 (N1N)',
  providerId: 'n1n',
  description: 'N1N · GPT Image 2 图像生成与编辑',
  eta: '30s',
  expectedDurationMs: 30000,
  defaultAspectRatio: '1:1',
  defaultResolution: '1024x1024',
  aspectRatios: ASPECT_RATIOS,
  resolutions: RESOLUTIONS,
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: referenceImageCount > 0 ? 'n1n/gpt-image-2-edit' : 'n1n/gpt-image-2',
    modeLabel: referenceImageCount > 0 ? '编辑模式' : '生成模式',
  }),
};
