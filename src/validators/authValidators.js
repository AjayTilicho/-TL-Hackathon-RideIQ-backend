import { body } from 'express-validator';

export const registerRules = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').trim().isEmail().withMessage('valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters'),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('password is required'),
];
