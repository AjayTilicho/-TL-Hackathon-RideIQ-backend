import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function stripBase64Payload(input) {
  if (!input || typeof input !== 'string') return '';
  const idx = input.indexOf('base64,');
  if (input.startsWith('data:') && idx !== -1) return input.slice(idx + 7);
  return input.trim();
}

function parseJsonFromModelText(text) {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/s, '');
  }
  return JSON.parse(t);
}

/**
 * Vision / PDF extraction for vehicle documents (RC, insurance, licence, PUC).
 * @param {{ imageBase64: string, mimeType?: string, fileName?: string, category?: string }} input
 */
export async function extractDocumentFromMedia(input) {
  const { imageBase64, mimeType = 'image/jpeg', fileName = '', category = '' } = input;
  if (!config.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is not configured on the server', 503);
  }
  const data = stripBase64Payload(imageBase64);
  if (!data) {
    throw new AppError('imageBase64 is empty after parsing', 400);
  }
  const mime = typeof mimeType === 'string' && mimeType.includes('/') ? mimeType : 'image/jpeg';

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: config.geminiModel });

  const prompt = `You are an assistant that reads Indian vehicle documents (RC, insurance, driving licence, PUC, etc.).

Context hints (may be empty):
- fileName: ${fileName || 'unknown'}
- category hint: ${category || 'unknown'}

Return a single JSON object ONLY (no markdown fences) with this exact shape:
{
  "holderName": string | null,
  "documentNumber": string | null,
  "expiryDateIso": string | null,
  "issueDateIso": string | null,
  "vehicleRegistration": string | null,
  "insurerName": string | null,
  "confidence": "high" | "medium" | "low"
}

Rules:
- Use null when a value is not clearly visible.
- Dates must be ISO yyyy-mm-dd when you can infer a full date; otherwise null.
- documentNumber: policy number, DL number, RC number, or similar primary identifier.
- confidence reflects how sure you are overall.`;

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: mime, data } },
      { text: prompt },
    ]);
    const text = result.response.text();
    const parsed = parseJsonFromModelText(text);
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium';
    return {
      holderName: parsed.holderName ?? null,
      documentNumber: parsed.documentNumber ?? null,
      expiryDateIso: parsed.expiryDateIso ?? null,
      issueDateIso: parsed.issueDateIso ?? null,
      vehicleRegistration: parsed.vehicleRegistration ?? null,
      insurerName: parsed.insurerName ?? null,
      confidence,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini]', err);
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    throw new AppError(`Document extraction failed: ${msg}`, 502);
  }
}
