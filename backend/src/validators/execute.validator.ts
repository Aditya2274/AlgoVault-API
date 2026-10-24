import { z } from 'zod';

export const supportedLanguageEnum = z.enum(['javascript', 'typescript', 'python']);

export const executeSchema = z.object({
  questionId: z.string({ required_error: 'Question ID is required' }).uuid('Invalid Question ID format'),
  language: supportedLanguageEnum,
  code: z
    .string({ required_error: 'Code is required' })
    .trim()
    .min(1, 'Code cannot be empty')
    .max(50000, 'Code exceeds 50,000 character limit'),
  customInput: z.string().trim().optional(),
});

export const getTemplateParamsSchema = z.object({
  questionId: z.string({ required_error: 'Question ID is required' }).uuid('Invalid Question ID format'),
});

export type ExecuteInput = z.infer<typeof executeSchema>;
