import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/env.js';
import * as geminiService from '../services/geminiService.js';
import { analyzeBikeImage } from '../services/ollamaBikeVisionService.js';
import { listOllamaModelTags } from '../services/ollamaModelsService.js';

export const extractDocument = asyncHandler(async (req, res) => {
  const data = await geminiService.extractDocumentFromMedia(req.body);
  res.json({ success: true, data });
});

export const listOllamaModels = asyncHandler(async (_req, res) => {
  const models = await listOllamaModelTags(config);
  res.json({
    success: true,
    data: {
      ollama_url: config.ollamaUrl,
      configured_vision_model: config.ollamaVisionModel,
      models,
      hint: 'Use a vision-capable tag in OLLAMA_VISION_MODEL. Text-only models cannot read images.',
    },
  });
});

export const analyzeBikeFromImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file?.buffer) {
    throw new AppError('Missing multipart field `image`.', 400);
  }
  const result = await analyzeBikeImage(config, file.buffer);
  res.json({
    success: true,
    data: {
      model: config.ollamaVisionModel,
      mime_type: file.mimetype,
      analysis: result.parsed,
      raw_model_text: result.raw_model_text,
    },
  });
});
