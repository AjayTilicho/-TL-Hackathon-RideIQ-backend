import { body, param } from 'express-validator';

const DOC_CATEGORIES = ['license', 'rc', 'insurance', 'puc', 'other'];

export const bikeIdInPath = [
  param('bikeId').isMongoId().withMessage('Invalid bike id'),
];

export const documentIdParam = [
  param('id').isMongoId().withMessage('Invalid document id'),
];

export const createDocumentRules = [
  body('bikeId').isMongoId().withMessage('bikeId must be a valid ObjectId'),
  body('type').optional().trim().notEmpty(),
  body('name').optional().isString().trim(),
  body('mimeType').optional().isString().trim(),
  body('category').optional().isIn(DOC_CATEGORIES),
  body('documentNumber').optional().isString(),
  body('expiryDate').optional({ nullable: true }).isISO8601().toDate(),
  body('image').isString().notEmpty().withMessage('image (Base64) is required'),
  body('extractedData').optional({ nullable: true }),
];

export const updateDocumentRules = [
  ...documentIdParam,
  body('type').optional().trim().notEmpty(),
  body('name').optional().isString().trim(),
  body('mimeType').optional().isString().trim(),
  body('category').optional().isIn(DOC_CATEGORIES),
  body('documentNumber').optional().isString(),
  body('expiryDate').optional({ nullable: true }).isISO8601().toDate(),
  body('image').optional().isString().notEmpty(),
  body('extractedData').optional(),
];
