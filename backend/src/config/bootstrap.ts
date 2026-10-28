import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

/**
 * Idempotent teacher bootstrap: creates the seed teacher (from env) and its
 * default cohort on server start. No raw SQL — Prisma upserts only.
 */
export async function bootstrapTeacher(): Promise<void> {
  const email = process.env.SEED_TEACHER_EMAIL;
  const password = process.env.SEED_TEACHER_PASSWORD;

  if (!email || !password) {
    console.warn('[bootstrap] SEED_TEACHER_EMAIL / SEED_TEACHER_PASSWORD not set — skipping teacher seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const teacher = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Teacher', email, passwordHash, role: 'Teacher' },
  });

  await prisma.cohort.upsert({
    where: { teacherId: teacher.id },
    update: {},
    create: { name: 'Default Cohort', teacherId: teacher.id },
  });

  console.log(`[bootstrap] Teacher ready: ${email}`);
}
