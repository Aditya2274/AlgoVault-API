import type { Request, Response, NextFunction } from 'express';
import { executeCode } from '../services/execution.service.js';
import { getStarterTemplates } from '../services/starter-code.service.js';
import questionService from '../services/question.service.js';
import progressService from '../services/progress.service.js';
import type { ExecuteInput } from '../validators/execute.validator.js';

export async function executeCodeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { questionId, language, code, customInput } = req.body as ExecuteInput;
    const executionResult = await executeCode({
      questionId,
      language,
      code,
      customInput,
    });

    // Record progress for students who pass all test cases (idempotent).
    if (req.user?.role === 'Student' && executionResult.summary.allPassed) {
      await progressService.recordCompletion(req.user.id, questionId);
    }

    res.status(200).json({
      status: 'success',
      data: executionResult,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTemplatesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const questionId = req.params.questionId as string;
    const question = await questionService.getQuestionById(questionId);

    if (!question) {
      res.status(404).json({
        status: 'error',
        message: 'Question not found',
      });
      return;
    }

    const testInputs = question.testCases.map((tc) => tc.input);
    const templates = getStarterTemplates(question.title, testInputs);

    res.status(200).json({
      status: 'success',
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  executeCodeHandler,
  getTemplatesHandler,
};
