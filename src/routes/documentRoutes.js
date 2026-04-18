import { Router } from 'express';
import * as documentController from '../controllers/documentController.js';
import { validate } from '../middleware/validate.js';
import {
  bikeIdInPath,
  createDocumentRules,
  documentIdParam,
  updateDocumentRules,
} from '../validators/documentValidators.js';

const router = Router();

router.post('/', createDocumentRules, validate, documentController.createDocument);
router.get('/record/:id', documentIdParam, validate, documentController.getDocumentById);
router.get('/:bikeId', bikeIdInPath, validate, documentController.getDocumentsByBike);
router.put('/:id', updateDocumentRules, validate, documentController.updateDocument);
router.delete('/:id', documentIdParam, validate, documentController.deleteDocument);

export default router;
