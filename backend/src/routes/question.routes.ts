import { Router } from 'express';
import questionController from '../controllers/question.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
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
  validateRequest({ query: queryQuestionSchema }),
  questionController.getQuestions
);

router.get(
  '/:id',
  validateRequest({ params: questionIdParamSchema }),
  questionController.getQuestionById
);

router.post(
  '/',
  validateRequest({ body: createQuestionSchema }),
  questionController.createQuestion
);

router.put(
  '/:id',
  validateRequest({ params: questionIdParamSchema, body: updateQuestionSchema }),
  questionController.updateQuestion
);

router.delete(
  '/:id',
  validateRequest({ params: questionIdParamSchema }),
  questionController.deleteQuestion
);

// Nested Test Case routes
router.get(
  '/:id/test-cases',
  validateRequest({ params: questionIdParamSchema }),
  questionController.getTestCases
);

router.post(
  '/:id/test-cases',
  validateRequest({ params: questionIdParamSchema, body: testCaseInputSchema }),
  questionController.addTestCase
);

router.post(
  '/:id/test-cases/bulk',
  validateRequest({ params: questionIdParamSchema, body: bulkCreateTestCaseSchema }),
  questionController.addTestCasesBulk
);

router.delete(
  '/:id/test-cases/:testCaseId',
  validateRequest({ params: testCaseParamSchema }),
  questionController.deleteTestCase
);

export default router;
