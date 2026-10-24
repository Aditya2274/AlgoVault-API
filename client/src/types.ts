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
