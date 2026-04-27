import {
  generateImage,
  getGenerateImageJob,
  setApiKey,
  submitGenerateImageJob,
} from '@/commands/ai';
import { imageUrlToDataUrl, persistImageLocally } from '@/features/canvas/application/imageData';

import type { AiGateway, GenerateImagePayload } from '../application/ports';

async function normalizeReferenceImages(payload: GenerateImagePayload): Promise<string[] | undefined> {
  const isKieModel = payload.model.startsWith('kie/');
  return payload.referenceImages
    ? await Promise.all(
      payload.referenceImages.map(async (imageUrl) =>
        isKieModel
          ? await imageUrlToDataUrl(imageUrl)
          : await persistImageLocally(imageUrl)
      )
    )
    : undefined;
}

async function normalizeVideoFirstFrame(payload: GenerateImagePayload): Promise<Record<string, unknown> | undefined> {
  if (!payload.extraParams) return undefined;
  const firstFrameUrl = payload.extraParams.first_frame_url;
  if (typeof firstFrameUrl !== 'string' || !firstFrameUrl) return undefined;
  const isKieModel = payload.model.startsWith('kie/');
  const normalizedUrl = isKieModel
    ? await imageUrlToDataUrl(firstFrameUrl)
    : await persistImageLocally(firstFrameUrl);
  return { ...payload.extraParams, first_frame_url: normalizedUrl };
}

export const tauriAiGateway: AiGateway = {
  setApiKey,
  generateImage: async (payload: GenerateImagePayload) => {
    const normalizedReferenceImages = await normalizeReferenceImages(payload);

    return await generateImage({
      prompt: payload.prompt,
      model: payload.model,
      size: payload.size,
      aspect_ratio: payload.aspectRatio,
      reference_images: normalizedReferenceImages,
      extra_params: payload.extraParams,
    });
  },
  submitGenerateImageJob: async (payload: GenerateImagePayload) => {
    const normalizedReferenceImages = await normalizeReferenceImages(payload);
    const normalizedExtraParams = await normalizeVideoFirstFrame(payload) ?? payload.extraParams;
    return await submitGenerateImageJob({
      prompt: payload.prompt,
      model: payload.model,
      size: payload.size,
      aspect_ratio: payload.aspectRatio,
      reference_images: normalizedReferenceImages,
      extra_params: normalizedExtraParams,
    });
  },
  getGenerateImageJob,
};
