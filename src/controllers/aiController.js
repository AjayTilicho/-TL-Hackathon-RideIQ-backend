import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/env.js';
import * as geminiService from '../services/geminiService.js';
import { analyzeBikeImage } from '../services/ollamaBikeVisionService.js';
import { listOllamaModelTags } from '../services/ollamaModelsService.js';

function useGeminiVision() {
  return Boolean(config.geminiApiKey && String(config.geminiApiKey).trim());
}

export const extractDocument = asyncHandler(async (req, res) => {
  const data = await geminiService.extractDocumentFromMedia(req.body);
  res.json({ success: true, data });
});

export const listOllamaModels = asyncHandler(async (_req, res) => {
  const models = await listOllamaModelTags(config);
  res.json({
    success: true,
    data: {
      bike_scan_provider: 'ollama',
      ollama_url: config.ollamaUrl,
      configured_vision_model: config.ollamaVisionModel,
      models,
      gemini_configured: useGeminiVision(),
      gemini_model: useGeminiVision() ? config.geminiModel : undefined,
      hint: useGeminiVision()
        ? 'Bike scan always uses local Ollama (OLLAMA_VISION_MODEL). Documents and personalized tips use Google Gemini.'
        : 'Bike scan uses Ollama. Set GEMINI_API_KEY for documents and personalized dashboard tips (Gemini).',
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
      vision_provider: 'ollama',
      mime_type: file.mimetype,
      analysis: result.parsed,
      raw_model_text: result.raw_model_text,
    },
  });
});

export const dashboardTips = asyncHandler(async (req, res) => {
  const { bike, stats, imageBase64 } = req.body ?? {};
  if (!bike || typeof bike !== 'object') {
    throw new AppError('body.bike (object) is required', 400);
  }
  if (!stats || typeof stats !== 'object') {
    throw new AppError('body.stats (object) is required', 400);
  }
  if (!useGeminiVision()) {
    throw new AppError(
      'Personalized tips require GEMINI_API_KEY on the server (same key as document AI). Ollama is not used for this feature.',
      503,
    );
  }
  const result = await geminiService.generateDashboardTipsGemini({
    bike,
    stats,
    imageBase64: typeof imageBase64 === 'string' ? imageBase64 : '',
  });
  res.json({
    success: true,
    data: {
      model: config.geminiModel,
      vision_provider: 'gemini',
      tips: result.parsed,
      raw_model_text: result.raw,
    },
  });
});
