import { Router } from 'express';
import questionController from '../controllers/question.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  queryQuestionSchema,
  questionIdParamSchema,
  testCaseInputSchema,
  bulkCreateTestCaseSchema,
  testCaseParamSchema,
} from '../validators/question.validator.js';

const router = Router();

router.get(
  '/',
  authenticate,
  validateRequest({ query: queryQuestionSchema }),
  questionController.getQuestions
);

router.get(
  '/:id',
  authenticate,
  validateRequest({ params: questionIdParamSchema }),
  questionController.getQuestionById
);

router.post(
  '/',
  authenticate,
  authorize('Teacher'),
  validateRequest({ body: createQuestionSchema }),
  questionController.createQuestion
);

router.put(
  '/:id',
  authenticate,
  authorize('Teacher'),
  validateRequest({ params: questionIdParamSchema, body: updateQuestionSchema }),
  questionController.updateQuestion
);

router.delete(
  '/:id',
  authenticate,
  authorize('Teacher'),
  validateRequest({ params: questionIdParamSchema }),
  questionController.deleteQuestion
);

// Nested Test Case routes
router.get(
  '/:id/test-cases',
  authenticate,
  validateRequest({ params: questionIdParamSchema }),
  questionController.getTestCases
);

router.post(
  '/:id/test-cases',
  authenticate,
  authorize('Teacher'),
  validateRequest({ params: questionIdParamSchema, body: testCaseInputSchema }),
  questionController.addTestCase
);

router.post(
  '/:id/test-cases/bulk',
  authenticate,
  authorize('Teacher'),
  validateRequest({ params: questionIdParamSchema, body: bulkCreateTestCaseSchema }),
  questionController.addTestCasesBulk
);

router.delete(
  '/:id/test-cases/:testCaseId',
  authenticate,
  authorize('Teacher'),
  validateRequest({ params: testCaseParamSchema }),
  questionController.deleteTestCase
);

export default router;
