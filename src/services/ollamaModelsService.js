import { AppError } from '../utils/AppError.js';

/** @param {{ ollamaUrl: string }} cfg */
export async function listOllamaModelTags(cfg) {
  const url = new URL('/api/tags', `${cfg.ollamaUrl}/`).toString();
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new AppError(
      `Could not list Ollama models (${res.status}): ${t || res.statusText}. Is Ollama running at ${cfg.ollamaUrl}?`,
      502,
    );
  }
  const data = await res.json();
  return data.models ?? [];
}
