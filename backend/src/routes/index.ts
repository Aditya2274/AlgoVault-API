import { Router } from 'express';
import healthRoutes from './health.routes.js';
import questionRoutes from './question.routes.js';
import executeRoutes from './execute.routes.js';
import authRoutes from './auth.routes.js';
import cohortRoutes from './cohort.routes.js';
import sessionRoutes from './session.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/questions', questionRoutes);
router.use('/execute', executeRoutes);
router.use('/auth', authRoutes);
router.use('/cohort', cohortRoutes);
router.use('/sessions', sessionRoutes);

export default router;
