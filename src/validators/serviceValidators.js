import { body, param } from 'express-validator';

export const serviceBikeIdParam = [
  param('bikeId').isMongoId().withMessage('Invalid bike id'),
];

export const serviceIdParam = [
  param('id').isMongoId().withMessage('Invalid service id'),
];

export const createServiceRules = [
  body('bikeId').isMongoId().withMessage('bikeId must be a valid ObjectId'),
  body('serviceDate').isISO8601().toDate().withMessage('serviceDate must be ISO 8601'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('notes').optional().isString().trim(),
  body('cost').optional().isFloat({ min: 0 }).toFloat(),
  body('odoKm').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  body('serviceCenter').optional().isString().trim(),
];

export const updateServiceRules = [
  ...serviceIdParam,
  body('serviceDate').optional().isISO8601().toDate(),
  body('title').optional().trim().notEmpty(),
  body('notes').optional().isString().trim(),
  body('cost').optional().isFloat({ min: 0 }).toFloat(),
  body('odoKm').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  body('serviceCenter').optional().isString().trim(),
];
