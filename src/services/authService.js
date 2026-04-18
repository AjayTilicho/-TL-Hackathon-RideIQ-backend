import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/env.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  const payload = {
    sub: String(user._id),
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function buildAuthCookie(token) {
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  return {
    name: config.authCookieName,
    value: token,
    options: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    },
  };
}

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hash,
  });
  const plain = user.toObject();
  delete plain.password;
  const token = signToken(user);
  return { user: { id: String(user._id), name: plain.name, email: plain.email }, token };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !user.password) {
    throw new AppError('Invalid email or password', 401);
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new AppError('Invalid email or password', 401);
  }
  const token = signToken(user);
  return {
    user: { id: String(user._id), name: user.name, email: user.email },
    token,
  };
}

export async function getUserById(id) {
  const user = await User.findById(id).lean();
  if (!user) return null;
  return { id: String(user._id), name: user.name, email: user.email };
}
