import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const registerStudentSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});

export const createCohortSchema = z.object({
  name: z
    .string({ required_error: 'Cohort name is required' })
    .trim()
    .min(2, 'Cohort name must be at least 2 characters')
    .max(100, 'Cohort name cannot exceed 100 characters'),
});

export const enrollStudentSchema = z.object({
  studentId: z.string({ required_error: 'Student ID is required' }).uuid('Invalid student ID'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
