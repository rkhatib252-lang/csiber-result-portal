import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subject = await prisma.subject.findUnique({
    where: { code: 'BCAS01' },
  });
  console.log('BCAS01 subject:', subject?.code ?? 'Not found');

  const subjects = await prisma.subject.findMany({
    where: {
      code: {
        in: ['BCAS01', 'BCAS02', 'BCAS03', 'BCAS04', 'BCAS05'],
      },
    },
  });
  console.log('Demo subjects count:', subjects.length);

  const results = await prisma.result.findMany({
    where: { prn: 'DEMO-BCA-001' },
  });
  console.log('Demo results count:', results.length);

  for (const result of results) {
    const subject = await prisma.subject.findUnique({
      where: { id: result.subjectId },
    });
    console.log(result.id, subject?.code);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
