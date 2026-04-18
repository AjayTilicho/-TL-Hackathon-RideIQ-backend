import { AppError } from '../utils/AppError.js';

const SYSTEM_PROMPT = `Motorcycle/bicycle expert. User photo may be motorbike, scooter, or cycle.

Return ONE JSON object only (no markdown). Shape:
{
  "image_assessment": "clear bike photo | partial | not a bike | unclear",
  "vehicle_type": "motorcycle | scooter | bicycle | electric two-wheeler | unknown",
  "identified_details": {
    "brand_guess": "string or null",
    "model_guess": "string or null",
    "approx_engine_cc_or_equivalent": "string or null",
    "notable_visible_features": ["max 5 short items"]
  },
  "mileage_improvement_suggestions": [
    { "title": "short", "detail": "max 2 sentences", "expected_impact": "low|medium|high" }
  ],
  "disclaimer": "Guesses may be wrong; verify with RC/manual."
}

Rules: Be honest if not a bike. Exactly 4 suggestions for motor/scooter; for bicycles use efficiency/cadence/tires not fuel. Keep every string brief.`;

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/im.exec(trimmed);
  if (fence?.[1]) return fence[1].trim();
  return trimmed;
}

function tryParseJson(text) {
  const cleaned = stripCodeFences(text);
  return JSON.parse(cleaned);
}

/** @param {{ ollamaUrl: string, ollamaVisionModel: string, ollamaNumPredict: number }} cfg */
export async function analyzeBikeImage(cfg, imageBuffer) {
  const base64 = imageBuffer.toString('base64');
  const url = new URL('/api/chat', `${cfg.ollamaUrl}/`).toString();

  const body = {
    model: cfg.ollamaVisionModel,
    stream: false,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          'Analyze this image and return ONLY the JSON object described in your system instructions.',
        images: [base64],
      },
    ],
    options: {
      temperature: 0.2,
      num_predict: cfg.ollamaNumPredict,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const base = `Ollama request failed (${res.status}): ${errText || res.statusText}`;
    if (res.status === 404 && /not found/i.test(errText)) {
      throw new AppError(
        `${base} Vision model "${cfg.ollamaVisionModel}" is not installed. Run: ollama pull ${cfg.ollamaVisionModel} — or set OLLAMA_VISION_MODEL to a vision tag from GET /api/ai/models (e.g. llava, llama3.2-vision, moondream).`,
        502,
      );
    }
    throw new AppError(`${base} Check OLLAMA_URL and that Ollama is running.`, 502);
  }

  const data = await res.json();
  const content = data.message?.content?.trim();
  if (!content) {
    throw new AppError('Ollama returned an empty response.', 502);
  }

  try {
    return { raw_model_text: content, parsed: tryParseJson(content) };
  } catch {
    return {
      raw_model_text: content,
      parsed: {
        parse_error: true,
        note: 'Model did not return valid JSON; see raw_model_text.',
        fallback_text: content,
      },
    };
  }
}
