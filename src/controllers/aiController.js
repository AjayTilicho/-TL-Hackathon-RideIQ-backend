import { asyncHandler } from '../utils/asyncHandler.js';
import * as geminiService from '../services/geminiService.js';

export const extractDocument = asyncHandler(async (req, res) => {
  const data = await geminiService.extractDocumentFromMedia(req.body);
  res.json({ success: true, data });
});
