import { Router } from 'express';
import healthRoutes from './health.routes.js';
import questionRoutes from './question.routes.js';
import executeRoutes from './execute.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/questions', questionRoutes);
router.use('/execute', executeRoutes);

export default router;
