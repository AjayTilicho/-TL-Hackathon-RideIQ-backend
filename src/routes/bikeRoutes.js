import { Router } from 'express';
import * as bikeController from '../controllers/bikeController.js';
import { validate } from '../middleware/validate.js';
import {
  bikeIdParam,
  createBikeRules,
  updateBikeRules,
} from '../validators/bikeValidators.js';

const router = Router();

router.post('/', createBikeRules, validate, bikeController.createBike);
router.get('/', bikeController.getBikes);
router.get('/:id', bikeIdParam, validate, bikeController.getBike);
router.put('/:id', updateBikeRules, validate, bikeController.updateBike);
router.delete('/:id', bikeIdParam, validate, bikeController.deleteBike);

export default router;
