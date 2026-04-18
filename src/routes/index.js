import { Router } from 'express';
import bikeRoutes from './bikeRoutes.js';
import documentRoutes from './documentRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import aiRoutes from './aiRoutes.js';
import bunkRoutes from './bunkRoutes.js';
import authRoutes from './authRoutes.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bikes', requireAuth, bikeRoutes);
router.use('/documents', requireAuth, documentRoutes);
router.use('/services', requireAuth, serviceRoutes);
router.use('/ai', requireAuth, aiRoutes);
router.use('/bunks', bunkRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'RideIQ API is running' });
});

export default router;
