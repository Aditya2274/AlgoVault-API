import prisma from '../config/prisma.js';
import type { Prisma, Difficulty } from '@prisma/client';
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
  QueryQuestionInput,
} from '../validators/question.validator.js';

export class QuestionService {
  /**
   * Fetch paginated list of questions with optional filtering & search
   */
  async getQuestions(query: QueryQuestionInput) {
    const { page, limit, difficulty, tag, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};

    if (difficulty) {
      where.difficulty = difficulty as Difficulty;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [questions, total] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          testCases: true,
        },
      }),
      prisma.question.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Fetch a single question by ID
   */
  async getQuestionById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        testCases: true,
      },
    });
  }

  /**
   * Create a new question with nested test cases
   */
  async createQuestion(data: CreateQuestionInput) {
    const { title, description, difficulty, tags, testCases } = data;

    return prisma.question.create({
      data: {
        title,
        description,
        difficulty: difficulty as Difficulty,
        tags,
        testCases: {
          create: testCases,
        },
      },
      include: {
        testCases: true,
      },
    });
  }

  /**
   * Update an existing question and optionally replace test cases
   */
  async updateQuestion(id: string, data: UpdateQuestionInput) {
    const { title, description, difficulty, tags, testCases } = data;

    if (testCases !== undefined) {
      return prisma.$transaction(async (tx) => {
        // Clear existing test cases to replace with new ones
        await tx.testCase.deleteMany({
          where: { questionId: id },
        });

        return tx.question.update({
          where: { id },
          data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(difficulty !== undefined && { difficulty: difficulty as Difficulty }),
            ...(tags !== undefined && { tags }),
            testCases: {
              create: testCases,
            },
          },
          include: {
            testCases: true,
          },
        });
      });
    }

    return prisma.question.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(difficulty !== undefined && { difficulty: difficulty as Difficulty }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        testCases: true,
      },
    });
  }

  /**
   * Delete a question (test cases are deleted by DB cascade)
   */
  async deleteQuestion(id: string) {
    return prisma.question.delete({
      where: { id },
    });
  }
}

export const questionService = new QuestionService();
export default questionService;
