import { Router } from 'express';
import bikeRoutes from './bikeRoutes.js';
import documentRoutes from './documentRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = Router();

router.use('/bikes', bikeRoutes);
router.use('/documents', documentRoutes);
router.use('/services', serviceRoutes);
router.use('/ai', aiRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'RideIQ API is running' });
});

export default router;
