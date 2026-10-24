import { Router } from 'express';
import healthRoutes from './health.routes.js';
import questionRoutes from './question.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/questions', questionRoutes);

export default router;
