import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export class CohortService {
  async createCohort(teacherId: string, name: string) {
    const existing = await prisma.cohort.findUnique({ where: { teacherId } });
    if (existing) throw new AppError('A cohort already exists for this teacher', 409);

    return prisma.cohort.create({ data: { name, teacherId } });
  }

  async ensureCohort(teacherId: string, name = 'Default Cohort') {
    const existing = await prisma.cohort.findUnique({ where: { teacherId } });
    if (existing) return existing;
    return prisma.cohort.create({ data: { name, teacherId } });
  }

  async enrollStudent(studentId: string, teacherId: string) {
    const cohort = await prisma.cohort.findUnique({ where: { teacherId } });
    if (!cohort) throw new AppError('Create a cohort before enrolling students', 400);

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return null;
    if (student.role !== 'Student') throw new AppError('Only students can be enrolled', 400);

    return prisma.user.update({
      where: { id: studentId },
      data: { cohortId: cohort.id },
      select: { id: true, cohortId: true, name: true },
    });
  }

  async getRoster(teacherId: string) {
    const cohort = await prisma.cohort.findUnique({
      where: { teacherId },
      include: { students: { orderBy: { createdAt: 'asc' } } },
    });
    if (!cohort) return null;

    return cohort.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      completedCount: s.completedQuestions.length,
      completedQuestions: s.completedQuestions,
      totalScore: s.totalScore,
    }));
  }
}

export const cohortService = new CohortService();
export default cohortService;
