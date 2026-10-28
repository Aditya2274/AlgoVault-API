import type { Request, Response, NextFunction } from 'express';
import cohortService from '../services/cohort.service.js';
import type { CreateCohortInput, EnrollStudentInput } from '../validators/auth.validator.js';

export class CohortController {
  async createCohort(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body as CreateCohortInput;
      const cohort = await cohortService.createCohort(req.user!.id, name);
      res.status(201).json({ status: 'success', data: cohort });
    } catch (error) {
      next(error);
    }
  }

  async enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.body as EnrollStudentInput;
      const updated = await cohortService.enrollStudent(studentId, req.user!.id);
      if (!updated) {
        res.status(404).json({ status: 'error', message: 'Student not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  }

  async getRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roster = await cohortService.getRoster(req.user!.id);
      if (roster === null) {
        res.status(404).json({ status: 'error', message: 'Cohort not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: roster });
    } catch (error) {
      next(error);
    }
  }
}

export const cohortController = new CohortController();
export default cohortController;
