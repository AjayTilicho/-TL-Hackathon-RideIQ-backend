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

function stripDataUrlBase64(raw) {
  if (!raw || typeof raw !== 'string') return { mimeType: 'image/jpeg', data: '' };
  const s = raw.trim();
  const full = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(s);
  if (full) {
    return { mimeType: full[1], data: full[2].replace(/\s/g, '') };
  }
  const loose = /^data:image\/\w+;base64,(.+)$/i.exec(s);
  if (loose) return { mimeType: 'image/jpeg', data: loose[1].replace(/\s/g, '') };
  return { mimeType: 'image/jpeg', data: s.replace(/\s/g, '') };
}

const DASHBOARD_TIPS_SYSTEM = `You are RideIQ, an expert on Indian two-wheelers (motorcycles, scooters) and fuel efficiency.

You will receive JSON describing the rider's bike and their logged fuel statistics. You may also receive a photo of their bike.

Respond with ONE JSON object only (no markdown). Shape:
{
  "summary": "One friendly sentence referencing their numbers or photo.",
  "from_photo": "If a photo was provided: one short line on what you notice (condition, type). If no image: null",
  "tips": [
    {
      "title": "Short headline",
      "body": "2–4 practical sentences for Indian traffic, maintenance, or riding style.",
      "category": "mileage | maintenance | riding | fuel | safety"
    }
  ],
  "disclaimer": "Tips are informational; verify with your manual and mechanic."
}

Rules:
- Output exactly 5 tips in the tips array, diverse categories where possible.
- Use the provided averages and totals; if average km/L is missing, infer cautiously from claimed mileage and suggest logging fill-ups.
- Be specific to their engine class when cc is known.
- Keep language concise and actionable.`;

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

/**
 * Dashboard tips via Gemini (optional bike photo).
 * @param {{ bike: object, stats: object, imageBase64?: string }} input
 */
export async function generateDashboardTipsGemini(input) {
  if (!config.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is not configured on the server', 503);
  }
  const { bike, stats, imageBase64 = '' } = input;
  const userPayload = JSON.stringify({ bike, stats }, null, 2);
  const { mimeType, data: imageData } = stripDataUrlBase64(imageBase64);

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: config.geminiModel });

  const textBlock = imageData
    ? `Context JSON:\n${userPayload}\n\nA bike photo is attached. Use both the numbers and the photo. Return ONLY the JSON object from your system instructions.`
    : `Context JSON:\n${userPayload}\n\nNo photo — tips from data only. Return ONLY the JSON object from your system instructions.`;

  const parts = [{ text: `${DASHBOARD_TIPS_SYSTEM}\n\n${textBlock}` }];
  if (imageData) {
    parts.push({ inlineData: { mimeType, data: imageData } });
  }

  try {
    const result = await model.generateContent(parts);
    const raw = result.response.text().trim();
    let parsed;
    try {
      parsed = parseJsonFromModelText(raw);
    } catch {
      parsed = {
        parse_error: true,
        summary: 'Could not parse AI JSON.',
        from_photo: null,
        tips: [{ title: 'Raw response', body: raw.slice(0, 1200), category: 'riding' }],
        disclaimer: 'Model returned non-JSON; showing truncated raw text in tips[0].',
      };
    }
    return { raw, parsed };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[gemini dashboard tips]', err);
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    throw new AppError(`Dashboard tips failed: ${msg}`, 502);
  }
}
