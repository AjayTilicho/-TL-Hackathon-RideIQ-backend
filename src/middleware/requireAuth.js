import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  let token = req.cookies?.[config.authCookieName];
  const header = req.headers.authorization;
  if (!token && typeof header === 'string' && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }
  if (!token) {
    next(new AppError('Not authenticated', 401));
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const id = decoded.sub;
    if (!id) {
      next(new AppError('Invalid session', 401));
      return;
    }
    req.user = {
      id: String(id),
      email: typeof decoded.email === 'string' ? decoded.email : '',
      name: typeof decoded.name === 'string' ? decoded.name : '',
    };
    next();
  } catch {
    next(new AppError('Session expired', 401));
  }
}
