import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { validate } from '../middleware/validate.js';
import { documentExtractRules } from '../validators/aiValidators.js';

const router = Router();

router.post('/document-extract', documentExtractRules, validate, aiController.extractDocument);

export default router;
