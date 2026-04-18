import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';
import { config } from '../config/env.js';

function setAuthCookie(res, token) {
  const c = authService.buildAuthCookie(token);
  res.cookie(c.name, c.value, c.options);
}

function clearAuthCookie(res) {
  res.clearCookie(config.authCookieName, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  res.json({ success: true, data: { user, token } });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: { ok: true } });
});

export const me = asyncHandler(async (req, res) => {
  let token = req.cookies?.[config.authCookieName];
  const header = req.headers.authorization;
  if (!token && typeof header === 'string' && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }
  if (!token) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await authService.getUserById(decoded.sub);
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch {
    clearAuthCookie(res);
    res.status(401).json({ success: false, message: 'Session expired' });
  }
});
