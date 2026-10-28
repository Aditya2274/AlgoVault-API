import type { Request, Response, NextFunction } from 'express';
import sessionService from '../services/session.service.js';
import { emitToSession } from '../realtime/socket.js';
import type { CreateSessionInput } from '../validators/session.validator.js';

export class SessionController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateSessionInput;
      const session = await sessionService.createSession(req.user!.id, body);
      res.status(201).json({ status: 'success', data: session });
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionService.listSessions(req.user!);
      res.status(200).json({ status: 'success', data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.getSession(req.params.id as string);
      if (!session) {
        res.status(404).json({ status: 'error', message: 'Session not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: session });
    } catch (error) {
      next(error);
    }
  }

  async endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.endSession(req.params.id as string, req.user!.id);
      if (!session) {
        res.status(404).json({ status: 'error', message: 'Session not found' });
        return;
      }
      emitToSession(session.id, 'session:ended', { sessionId: session.id });
      res.status(200).json({ status: 'success', data: session });
    } catch (error) {
      next(error);
    }
  }
}

export const sessionController = new SessionController();
export default sessionController;
