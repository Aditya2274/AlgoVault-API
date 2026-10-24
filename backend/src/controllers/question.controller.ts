import type { Request, Response, NextFunction } from 'express';
import questionService from '../services/question.service.js';
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
  QueryQuestionInput,
} from '../validators/question.validator.js';

export class QuestionController {
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as QueryQuestionInput;
      const result = await questionService.getQuestions(query);

      res.status(200).json({
        status: 'success',
        data: result.questions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuestionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const question = await questionService.getQuestionById(id as string);

      if (!question) {
        res.status(404).json({
          status: 'error',
          message: `Question with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateQuestionInput;
      const newQuestion = await questionService.createQuestion(body);

      res.status(201).json({
        status: 'success',
        data: newQuestion,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateQuestionInput;

      // Check existence first
      const existing = await questionService.getQuestionById(id as string);
      if (!existing) {
        res.status(404).json({
          status: 'error',
          message: `Question with ID '${id}' not found`,
        });
        return;
      }

      const updated = await questionService.updateQuestion(id as string, body);

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await questionService.getQuestionById(id as string);
      if (!existing) {
        res.status(404).json({
          status: 'error',
          message: `Question with ID '${id}' not found`,
        });
        return;
      }

      await questionService.deleteQuestion(id as string);

      res.status(200).json({
        status: 'success',
        message: 'Question deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async addTestCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const testCase = await questionService.addTestCase(id as string, req.body);
      if (!testCase) {
        res.status(404).json({
          status: 'error',
          message: `Question with ID '${id}' not found`,
        });
        return;
      }
      res.status(201).json({
        status: 'success',
        data: testCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async addTestCasesBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const testCases = await questionService.addTestCasesBulk(id as string, req.body.testCases);
      if (!testCases) {
        res.status(404).json({
          status: 'error',
          message: `Question with ID '${id}' not found`,
        });
        return;
      }
      res.status(201).json({
        status: 'success',
        data: testCases,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTestCases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const testCases = await questionService.getTestCases(id as string);
      if (!testCases) {
        res.status(404).json({
          status: 'error',
          message: `Question with ID '${id}' not found`,
        });
        return;
      }
      res.status(200).json({
        status: 'success',
        data: testCases,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTestCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, testCaseId } = req.params;
      const deleted = await questionService.deleteTestCase(id as string, testCaseId as string);
      if (!deleted) {
        res.status(404).json({
          status: 'error',
          message: `TestCase with ID '${testCaseId}' not found for question '${id}'`,
        });
        return;
      }
      res.status(200).json({
        status: 'success',
        message: 'Test case deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
export default questionController;
