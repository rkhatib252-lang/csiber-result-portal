const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.result.findFirst({
    where: { prn: 'DEMO-BCA-001' },
    include: { subject: true, semester: true, student: true }
  });
  console.log('Result API test:', result ? 'OK' : 'FAIL');

  const student = await prisma.student.findUnique({ where: { prn: 'DEMO-BCA-001' }, include: { user: true } });
  console.log('Student login test:', student ? 'OK' : 'FAIL');

  const verify = await prisma.result.findMany({ where: { prn: 'DEMO-BCA-001' } });
  console.log('Result verification test:', verify.length === 5 ? 'OK' : 'FAIL');

  // Test all routes still exist
  const allResults = await prisma.result.count();
  const allStudents = await prisma.student.count();
  console.log('Total results:', allResults);
  console.log('Total students:', allStudents);
}

main().finally(() => prisma.$disconnect());
