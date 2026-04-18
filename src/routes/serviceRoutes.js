import { Router } from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { validate } from '../middleware/validate.js';
import {
  createServiceRules,
  serviceBikeIdParam,
  serviceIdParam,
  updateServiceRules,
} from '../validators/serviceValidators.js';

const router = Router();

router.post('/', createServiceRules, validate, serviceController.createService);
router.get('/:bikeId', serviceBikeIdParam, validate, serviceController.getServicesByBike);
router.put('/:id', updateServiceRules, validate, serviceController.updateService);
router.delete('/:id', serviceIdParam, validate, serviceController.deleteService);

export default router;
