import { body } from 'express-validator';

export const documentExtractRules = [
  body('imageBase64').isString().notEmpty().withMessage('imageBase64 is required'),
  body('mimeType').optional().isString().trim(),
  body('fileName').optional().isString().trim(),
  body('category').optional().isString().trim(),
];
