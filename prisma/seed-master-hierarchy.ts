import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding master hierarchy (Department -> Course -> ClassYear)...');

  // 1. Department: Computer
  const computerDept = await prisma.department.upsert({
    where: { code: 'COMP' },
    update: {},
    create: {
      code: 'COMP',
      name: 'Computer',
      description: 'Department of Computer Science & Applications',
    },
  });
  console.log('Department created:', computerDept.code, computerDept.name);

  // 2. Courses under Computer department
  const courses = [
    {
      code: 'BCA',
      name: 'B. C. A.',
      description: 'Bachelor of Computer Applications',
      durationYears: 3,
    },
    {
      code: 'BSC_CS',
      name: 'B.SC. COMP.SCI.',
      description: 'B.Sc. Computer Science',
      durationYears: 3,
    },
    {
      code: 'MCA',
      name: 'M. C. A.',
      description: 'Master of Computer Applications',
      durationYears: 2,
    },
    {
      code: 'MSC_CS',
      name: 'M. SC. COMP.SCI.',
      description: 'M.Sc. Computer Science',
      durationYears: 2,
    },
  ];

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { code_departmentId: { code: c.code, departmentId: computerDept.id } },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        description: c.description,
        durationYears: c.durationYears,
        departmentId: computerDept.id,
      },
    });
    console.log('Course created:', course.code, course.name);

    // 3. ClassYears for each course (all years)
    const years = course.durationYears === 3 ? [1, 2, 3] : [1, 2];
    for (const y of years) {
      const classYear = await prisma.classYear.upsert({
        where: { courseId_year: { courseId: course.id, year: y } },
        update: {},
        create: {
          name: `${course.name} ${y}${y === 1 ? 'st' : y === 2 ? 'nd' : 'rd'} Year`,
          year: y,
          courseId: course.id,
        },
      });
      console.log('  ClassYear:', classYear.name, '(year:', classYear.year, ')');
    }
  }

  // Verify relations
  const deptWithCourses = await prisma.department.findUnique({
    where: { id: computerDept.id },
    include: { courses: { include: { classYears: true } } },
  });
  console.log('\n=== VERIFICATION ===');
  console.log('Department:', deptWithCourses?.name);
  deptWithCourses?.courses.forEach(c => {
    console.log(`  Course: ${c.code} (${c.name})`);
    c.classYears.forEach(cy => console.log(`    ClassYear: ${cy.name} (year ${cy.year})`));
  });

  console.log('\nMaster hierarchy seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
