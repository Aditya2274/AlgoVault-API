import type { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service.js';
import type { LoginInput, RegisterStudentInput } from '../validators/auth.validator.js';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as RegisterStudentInput;
      const user = await authService.registerStudent(body);
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as LoginInput;
      const { token, user } = await authService.login(body);

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: COOKIE_MAX_AGE_MS,
        path: '/',
      });

      res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.status(200).json({ status: 'success', message: 'Logged out' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const user = await authService.me(userId);
      if (!user) {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
