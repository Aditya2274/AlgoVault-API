export type Role = 'Teacher' | 'Student';

export interface AuthUser {
  id: string;
  role: Role;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  cohortId: string | null;
  completedQuestions: string[];
  totalScore: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
