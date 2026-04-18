import { Router } from 'express';
import multer from 'multer';
import * as aiController from '../controllers/aiController.js';
import { validate } from '../middleware/validate.js';
import { documentExtractRules } from '../validators/aiValidators.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    if (!ok) {
      cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

router.get('/models', aiController.listOllamaModels);

router.post('/document-extract', documentExtractRules, validate, aiController.extractDocument);

router.post('/dashboard-tips', aiController.dashboardTips);

router.post(
  '/analyze-bike-image',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        next(new AppError(err.message || 'Upload failed', 400));
        return;
      }
      next();
    });
  },
  aiController.analyzeBikeFromImage,
);

export default router;
