import { Router } from 'express';
import questionController from '../controllers/question.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  queryQuestionSchema,
  questionIdParamSchema,
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

export default router;
