import { Router } from 'express';
import cohortController from '../controllers/cohort.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { createCohortSchema, enrollStudentSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(authenticate, authorize('Teacher'));

router.post('/', validateRequest({ body: createCohortSchema }), cohortController.createCohort);
router.post('/enroll', validateRequest({ body: enrollStudentSchema }), cohortController.enrollStudent);
router.get('/roster', cohortController.getRoster);

export default router;
