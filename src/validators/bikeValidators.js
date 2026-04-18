import { body, param } from 'express-validator';

export const bikeIdParam = [
  param('id').isMongoId().withMessage('Invalid bike id'),
];

export const createBikeRules = [
  body('brand').trim().notEmpty().withMessage('brand is required'),
  body('model').trim().notEmpty().withMessage('model is required'),
  body('year').trim().notEmpty().withMessage('year is required'),
  body('registrationNumber').trim().notEmpty().withMessage('registrationNumber is required'),
  body('fuelType').trim().notEmpty().withMessage('fuelType is required'),
  body('engineCc').optional().isString().trim(),
  body('category').optional().isString().trim(),
  body('claimedMileageKmL').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  body('fuelSystem').optional().isString().trim(),
  body('image').optional().isString(),
];

export const updateBikeRules = [
  ...bikeIdParam,
  body('brand').optional().trim().notEmpty(),
  body('model').optional().trim().notEmpty(),
  body('year').optional().trim().notEmpty(),
  body('registrationNumber').optional().trim().notEmpty(),
  body('fuelType').optional().trim().notEmpty(),
  body('engineCc').optional().isString().trim(),
  body('category').optional().isString().trim(),
  body('claimedMileageKmL').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  body('fuelSystem').optional().isString().trim(),
  body('image').optional({ nullable: true }).isString(),
];
