import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Backend package root (this file is in src/config/). */
const backendRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret && (process.env.NODE_ENV || 'development') === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[config] JWT_SECRET is not set — set it before running in production.');
}

export const config = {
  port: Number(process.env.PORT) || 5001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rideiq',
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  ollamaUrl: (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
  ollamaVisionModel: process.env.OLLAMA_VISION_MODEL || 'llava',
  ollamaNumPredict: Math.min(8192, Math.max(200, Number(process.env.OLLAMA_NUM_PREDICT) || 900)),
  jwtSecret: jwtSecret || 'dev-insecure-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  authCookieName: process.env.AUTH_COOKIE_NAME || 'rideiq_token',
};
