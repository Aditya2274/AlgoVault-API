import { Router } from 'express';
import sessionController from '../controllers/session.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { createSessionSchema, sessionIdParamSchema } from '../validators/session.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('Teacher'),
  validateRequest({ body: createSessionSchema }),
  sessionController.createSession
);

router.get('/', sessionController.listSessions);
router.get('/:id', validateRequest({ params: sessionIdParamSchema }), sessionController.getSession);
router.post(
  '/:id/end',
  authorize('Teacher'),
  validateRequest({ params: sessionIdParamSchema }),
  sessionController.endSession
);

export default router;
