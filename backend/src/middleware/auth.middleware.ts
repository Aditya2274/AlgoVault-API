import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import type { Role } from '../types/auth.js';

const COOKIE_NAME = 'token';

function getToken(req: Request): string | null {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (cookie) return cookie;

  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);

  return null;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ status: 'error', message: 'JWT_SECRET is not configured' });
    return;
  }

  const token = getToken(req);
  if (!token) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ status: 'error', message: 'You do not have permission to perform this action' });
      return;
    }

    next();
  };
