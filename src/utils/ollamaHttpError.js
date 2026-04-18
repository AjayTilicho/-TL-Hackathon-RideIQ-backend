import { AppError } from './AppError.js';

/**
 * Turn Ollama HTTP error bodies into actionable AppErrors (common: runner OOM / crash).
 * @param {number} status
 * @param {string} errText raw response body
 * @param {string} visionModel configured model name (for hints)
 */
export function ollamaHttpError(status, errText, visionModel) {
  let detail = typeof errText === 'string' ? errText : '';
  try {
    const j = JSON.parse(detail);
    if (typeof j.error === 'string') detail = j.error;
  } catch {
    // keep raw body
  }

  if (
    /model runner|unexpectedly stopped|resource limitations|out of memory|\boom\b|cuda error|vram|exhausted device memory|runner has unexpectedly/i.test(
      detail,
    )
  ) {
    return new AppError(
      [
        'Ollama stopped the model (usually GPU VRAM or system RAM).',
        `Try a smaller vision model, e.g. \`ollama pull moondream\` then set OLLAMA_VISION_MODEL=moondream,`,
        `or \`llama3.2-vision:3b\`. Lower OLLAMA_NUM_PREDICT (e.g. 400), run \`ollama ps\` and stop unused models,`,
        'close other GPU apps, update Ollama, and check the Ollama server logs.',
        `(Configured model: ${visionModel}.)`,
      ].join(' '),
      502,
    );
  }

  const clipped = detail.length > 600 ? `${detail.slice(0, 600)}…` : detail;
  return new AppError(`Ollama request failed (${status}): ${clipped || 'unknown error'}`, 502);
}
