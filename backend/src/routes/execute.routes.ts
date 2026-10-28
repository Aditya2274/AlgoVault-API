import { Router } from 'express';
import executeController from '../controllers/execute.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { executeSchema, getTemplateParamsSchema } from '../validators/execute.validator.js';

const router = Router();

router.post(
  '/',
  authenticate,
  validateRequest({ body: executeSchema }),
  executeController.executeCodeHandler
);

router.get(
  '/templates/:questionId',
  authenticate,
  validateRequest({ params: getTemplateParamsSchema }),
  executeController.getTemplatesHandler
);

export default router;
