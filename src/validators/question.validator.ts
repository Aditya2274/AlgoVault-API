import { z } from 'zod';

export const difficultyEnum = z.enum(['Easy', 'Medium', 'Hard']);

export const testCaseInputSchema = z.object({
  input: z.string({ required_error: 'Test case input is required' }),
  expectedOutput: z.string({ required_error: 'Test case expected output is required' }),
});

export const createQuestionSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters long'),
  difficulty: difficultyEnum,
  tags: z.array(z.string().trim().min(1)).default([]),
  testCases: z.array(testCaseInputSchema).default([]),
});

export const updateQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .optional(),
  difficulty: difficultyEnum.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  testCases: z.array(testCaseInputSchema).optional(),
});

export const queryQuestionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  difficulty: difficultyEnum.optional(),
  tag: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const questionIdParamSchema = z.object({
  id: z.string().uuid('Question ID must be a valid UUID'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QueryQuestionInput = z.infer<typeof queryQuestionSchema>;
export type QuestionIdParam = z.infer<typeof questionIdParamSchema>;
