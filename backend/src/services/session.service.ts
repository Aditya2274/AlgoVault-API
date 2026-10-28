import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { CreateSessionInput } from '../validators/session.validator.js';

const MESSAGE_HISTORY_LIMIT = 50;

export class SessionService {
  async createSession(teacherId: string, data: CreateSessionInput) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { taughtCohort: true },
    });
    if (!teacher?.taughtCohort) throw new AppError('You have no cohort yet', 400);

    return prisma.classSession.create({
      data: {
        title: data.title,
        cohortId: teacher.taughtCohort.id,
        teacherId,
        ...(data.questionId ? { questionId: data.questionId } : {}),
      },
      include: {
        question: { select: { id: true, title: true, difficulty: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  async listSessions(user: { id: string; role: string }) {
    if (user.role === 'Teacher') {
      return prisma.classSession.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          question: { select: { id: true, title: true, difficulty: true } },
          teacher: { select: { id: true, name: true } },
        },
      });
    }

    const student = await prisma.user.findUnique({ where: { id: user.id } });
    if (!student?.cohortId) return [];

    return prisma.classSession.findMany({
      where: { cohortId: student.cohortId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        question: { select: { id: true, title: true, difficulty: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  async getSession(id: string) {
    return prisma.classSession.findUnique({
      where: { id },
      include: {
        question: true,
        teacher: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: MESSAGE_HISTORY_LIMIT,
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }

  async endSession(id: string, teacherId: string) {
    const session = await prisma.classSession.findUnique({ where: { id } });
    if (!session) return null;
    if (session.teacherId !== teacherId) throw new AppError('Only the session teacher can end it', 403);

    return prisma.classSession.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Last N messages in chronological order (oldest first) for the chat UI.
   */
  async getMessages(sessionId: string) {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_HISTORY_LIMIT,
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    return messages.reverse();
  }

  async createMessage(sessionId: string, userId: string, body: string) {
    return prisma.chatMessage.create({
      data: { sessionId, userId, body },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  }

  async canJoin(sessionId: string, userId: string, role: string): Promise<boolean> {
    const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session || !session.isActive) return false;

    if (role === 'Teacher') return session.teacherId === userId;

    const student = await prisma.user.findUnique({ where: { id: userId } });
    return student?.cohortId === session.cohortId;
  }
}

export const sessionService = new SessionService();
export default sessionService;
