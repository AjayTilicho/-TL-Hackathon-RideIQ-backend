import { AppError } from '../utils/AppError.js';
import { ollamaHttpError } from '../utils/ollamaHttpError.js';

function stripDataUrlBase64(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(s);
  return (m ? m[1] : s).replace(/\s/g, '');
}

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/im.exec(trimmed);
  if (fence?.[1]) return fence[1].trim();
  return trimmed;
}

function tryParseJson(text) {
  return JSON.parse(stripCodeFences(text));
}

const SYSTEM = `You are RideIQ, an expert on Indian two-wheelers (motorcycles, scooters) and fuel efficiency.

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

/** @param {*} cfg env config with ollamaUrl, ollamaVisionModel, ollamaNumPredict */
export async function generateDashboardTips(cfg, input) {
  const { bike, stats } = input;
  const imageB64 = stripDataUrlBase64(input.imageBase64 ?? '');
  const userPayload = JSON.stringify({ bike, stats }, null, 2);

  const messages = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: imageB64
        ? `Context JSON:\n${userPayload}\n\nA bike photo is attached. Use both the numbers and the photo.`
        : `Context JSON:\n${userPayload}\n\nNo photo — tips from data only.`,
      ...(imageB64 ? { images: [imageB64] } : {}),
    },
  ];

  const url = new URL('/api/chat', `${cfg.ollamaUrl}/`).toString();
  const body = {
    model: cfg.ollamaVisionModel,
    stream: false,
    messages,
    options: {
      temperature: 0.35,
      num_predict: Math.min(2048, Math.max(400, cfg.ollamaNumPredict + 400)),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw ollamaHttpError(res.status, errText, cfg.ollamaVisionModel);
  }

  const data = await res.json();
  const content = data.message?.content?.trim();
  if (!content) throw new AppError('Empty Ollama response', 502);

  try {
    const parsed = tryParseJson(content);
    return { raw: content, parsed };
  } catch {
    return {
      raw: content,
      parsed: {
        parse_error: true,
        summary: 'Could not parse AI JSON.',
        from_photo: null,
        tips: [{ title: 'Raw response', body: content.slice(0, 1200), category: 'riding' }],
        disclaimer: 'Model returned non-JSON; showing truncated raw text in tips[0].',
      },
    };
  }
}
