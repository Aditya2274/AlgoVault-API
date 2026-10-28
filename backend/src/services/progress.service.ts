import prisma from '../config/prisma.js';

const COMPLETION_SCORE = 10;

export class ProgressService {
  /**
   * Idempotently mark a question as completed by a student and add a flat score.
   */
  async recordCompletion(userId: string, questionId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.completedQuestions.includes(questionId)) return user;

    return prisma.user.update({
      where: { id: userId },
      data: {
        completedQuestions: { push: questionId },
        totalScore: { increment: COMPLETION_SCORE },
      },
    });
  }
}

export const progressService = new ProgressService();
export default progressService;
