import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

function formatMongooseValidation(err) {
  const messages = Object.values(err.errors || {}).map((e) => e.message);
  return messages.join('; ') || 'Validation failed';
}

export function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error('[error]', err.message || err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: formatMongooseValidation(err),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key — resource already exists',
    });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
