import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create semester 5
  const semester5 = await prisma.semester.upsert({
    where: { number: 5 },
    update: {},
    create: {
      number: 5,
      name: 'Semester 5',
    },
  });

  // Demo subjects for Semester 5.
  const subjects = [
    {
      id: 'sub_bcas01',
      code: 'BCAS01',
      name: 'Database Management Systems',
      credits: 4,
      isHalfCredit: false,
    },
    {
      id: 'sub_bcas02',
      code: 'BCAS02',
      name: 'Java Programming',
      credits: 4,
      isHalfCredit: false,
    },
    {
      id: 'sub_bcas03',
      code: 'BCAS03',
      name: 'Computer Networks',
      credits: 4,
      isHalfCredit: false,
    },
    {
      id: 'sub_bcas04',
      code: 'BCAS04',
      name: 'Web Technologies',
      credits: 4,
      isHalfCredit: false,
    },
    {
      id: 'sub_bcas05',
      code: 'BCAS05',
      name: 'Artificial Intelligence',
      credits: 3,
      isHalfCredit: false,
    },
  ];

  for (const subjectData of subjects) {
    await prisma.subject.upsert({
      where: { code: subjectData.code },
      update: {},
      create: {
        id: subjectData.id,
        code: subjectData.code,
        name: subjectData.name,
        credits: subjectData.credits,
        isHalfCredit: subjectData.isHalfCredit,
        semesterId: semester5.id,
      },
    });
  }

  // Create a clearly fictional demo student.
  const student = await prisma.student.upsert({
    where: { prn: 'DEMO-BCA-001' },
    update: {},
    create: {
      prn: 'DEMO-BCA-001',
      name: 'Demo Student',
      email: 'student@example.com',
      batch: '2025',
    },
  });

  // Demo result data for UI and development testing.
  const resultsData = [
    {
      subjectCode: 'BCAS01',
      internalMarks: 18,
      externalMarks: 52,
      marksObtained: 70,
      maxMarks: 100,
      maxInternalMarks: 25,
      maxExternalMarks: 75,
      grade: 'B',
      gradePoint: 6.0,
      remark: 'PASS',
    },
    {
      subjectCode: 'BCAS02',
      internalMarks: 20,
      externalMarks: 58,
      marksObtained: 78,
      maxMarks: 100,
      maxInternalMarks: 25,
      maxExternalMarks: 75,
      grade: 'A',
      gradePoint: 8.0,
      remark: 'PASS',
    },
    {
      subjectCode: 'BCAS03',
      internalMarks: 17,
      externalMarks: 50,
      marksObtained: 67,
      maxMarks: 100,
      maxInternalMarks: 25,
      maxExternalMarks: 75,
      grade: 'B',
      gradePoint: 6.0,
      remark: 'PASS',
    },
    {
      subjectCode: 'BCAS04',
      internalMarks: 19,
      externalMarks: 56,
      marksObtained: 75,
      maxMarks: 100,
      maxInternalMarks: 25,
      maxExternalMarks: 75,
      grade: 'A',
      gradePoint: 8.0,
      remark: 'PASS',
    },
    {
      subjectCode: 'BCAS05',
      internalMarks: 22,
      externalMarks: 63,
      marksObtained: 85,
      maxMarks: 100,
      maxInternalMarks: 25,
      maxExternalMarks: 75,
      grade: 'A+',
      gradePoint: 9.0,
      remark: 'PASS',
    },
  ];

  for (const resultData of resultsData) {
    const subject = await prisma.subject.findUnique({
      where: { code: resultData.subjectCode },
    });

    if (subject) {
      await prisma.result.upsert({
        where: {
          prn_subjectId_semesterId: {
            prn: student.prn,
            subjectId: subject.id,
            semesterId: semester5.id,
          },
        },
        update: {},
        create: {
          prn: student.prn,
          subjectId: subject.id,
          semesterId: semester5.id,
          internalMarks: resultData.internalMarks,
          externalMarks: resultData.externalMarks,
          marksObtained: resultData.marksObtained,
          maxMarks: resultData.maxMarks,
          maxInternalMarks: resultData.maxInternalMarks,
          maxExternalMarks: resultData.maxExternalMarks,
          grade: resultData.grade,
          gradePoint: resultData.gradePoint,
          remark: resultData.remark,
        },
      });
    }
  }

  // Development admin account.
  // Set SEED_ADMIN_PASSWORD in .env before running the seed.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required. Add it to your local .env file before running the seed.'
    );
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: adminPasswordHash,
    },
    create: {
      email: 'admin@example.com',
      password: adminPasswordHash,
      name: 'Demo Administrator',
      role: 'ADMIN',
    },
  });

  console.log('Demo seed data inserted successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });