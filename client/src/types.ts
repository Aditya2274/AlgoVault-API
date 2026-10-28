export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  questionId: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  testCases: TestCase[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  pagination?: Pagination;
  message?: string;
}

export interface HealthResponse {
  status: 'success' | 'error';
  message: string;
  timeStamp: string;
}

export type SupportedLanguage = 'javascript' | 'typescript' | 'python';

export interface CodeTemplates {
  javascript: string;
  typescript: string;
  python: string;
  functionName: string;
}

export interface TestCaseResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: any;
  passed: boolean;
  runtimeMs: number;
  stdout: string;
  error: string | null;
}

export interface ExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  totalRuntimeMs: number;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compilation Error';
  stdout: string;
  stderr: string | null;
}

export interface ExecutionResponse {
  summary: ExecutionSummary;
  results: TestCaseResult[];
}

export type Role = 'Teacher' | 'Student';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  cohortId: string | null;
  completedQuestions: string[];
  totalScore: number;
}

export interface RosterStudent {
  id: string;
  name: string;
  email: string;
  completedCount: number;
  completedQuestions: string[];
  totalScore: number;
}

export interface SessionUser {
  id: string;
  name: string;
  role?: Role;
}

export interface SessionMessage {
  id: string;
  body: string;
  createdAt: string;
  user: SessionUser;
}

export interface ClassSession {
  id: string;
  title: string;
  isActive: boolean;
  cohortId?: string;
  questionId?: string | null;
  question?: { id: string; title: string; difficulty: Difficulty } | null;
  teacher?: SessionUser;
  createdAt: string;
  messages?: SessionMessage[];
}
