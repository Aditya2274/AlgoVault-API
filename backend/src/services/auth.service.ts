import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { Role, SafeUser } from '../types/auth.js';
import type { LoginInput, RegisterStudentInput } from '../validators/auth.validator.js';

const JWT_EXPIRES_IN = '7d';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT_SECRET is not configured', 500);
  return secret;
}

/**
 * Verify a JWT and return the authenticated identity, or null on any failure.
 * Single source for both the HTTP middleware and the Socket.io handshake.
 */
export function verifyToken(token: string): { id: string; role: Role } | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret) as { sub: string; role: Role };
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  cohortId: string | null;
  completedQuestions: string[];
  totalScore: number;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cohortId: user.cohortId,
    completedQuestions: user.completedQuestions,
    totalScore: user.totalScore,
  };
}

export class AuthService {
  signToken(user: { id: string; role: Role }): string {
    return jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  async registerStudent(data: RegisterStudentInput): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: 'Student' },
    });
    return toSafeUser(user);
  }

  async login(data: LoginInput): Promise<{ token: string; user: SafeUser }> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid email or password', 401);

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) throw new AppError('Invalid email or password', 401);

    return { token: this.signToken(user), user: toSafeUser(user) };
  }

  async me(userId: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toSafeUser(user) : null;
  }
}

export const authService = new AuthService();
export default authService;
