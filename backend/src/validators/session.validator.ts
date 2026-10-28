import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  questionId: z.string().uuid('Invalid question ID').optional(),
});

export const sessionIdParamSchema = z.object({
  id: z.string({ required_error: 'Session ID is required' }).uuid('Invalid session ID'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
