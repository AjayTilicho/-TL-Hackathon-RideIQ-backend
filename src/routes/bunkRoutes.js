import { Router } from 'express';
import * as bunkController from '../controllers/bunkController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', bunkController.getBunks);
router.get('/comments', bunkController.getAllComments);
router.post('/', requireAuth, bunkController.postBunk);
router.post('/:id/comments', requireAuth, bunkController.postComment);
router.post('/:id/rate', requireAuth, bunkController.postRate);
router.delete('/:id', requireAuth, bunkController.removeBunk);

export default router;
