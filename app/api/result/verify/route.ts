import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateAll, ResultItem } from '@/lib/result-calculator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prn = searchParams.get('prn')?.trim().toUpperCase();
  const semesterParam = searchParams.get('semester');

  if (!prn) {
    return NextResponse.json({ error: 'PRN is required' }, { status: 400 });
  }
  if (!semesterParam) {
    return NextResponse.json({ error: 'Semester is required' }, { status: 400 });
  }
  const semesterNumber = parseInt(semesterParam, 10);
  if (isNaN(semesterNumber) || semesterNumber < 1 || semesterNumber > 10) {
    return NextResponse.json({ error: 'Invalid semester' }, { status: 400 });
  }

  const semesterRecord = await prisma.semester.findUnique({
    where: { number: semesterNumber },
  });
  if (!semesterRecord) {
    return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
  }

  const results = await prisma.result.findMany({
    where: {
      prn,
      semesterId: semesterRecord.id,
    },
    include: {
      subject: true,
      semester: true,
      student: {
        include: {
          classYear: {
            include: {
              course: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (results.length === 0) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  const student = results[0].student;
  const studentCourse = student.classYear?.course;
  const studentDepartment = studentCourse?.department;

  const calcItems: ResultItem[] = results.map(r => ({
    internalMarks: r.internalMarks ?? 0,
    externalMarks: r.externalMarks ?? 0,
    marksObtained: r.marksObtained,
    maxMarks: r.maxMarks,
    maxInternalMarks: r.maxInternalMarks ?? 25,
    maxExternalMarks: r.maxExternalMarks ?? 75,
    grade: r.grade ?? undefined,
    gradePoint: r.gradePoint !== null && r.gradePoint !== undefined ? Number(r.gradePoint) : undefined,
    credits: r.subject?.credits ?? undefined,
    isHalfCredit: r.subject?.isHalfCredit ?? undefined,
  }));
  const calc = calculateAll(calcItems);

  return NextResponse.json({
    found: true,
    student: {
      name: student.name,
      prn: student.prn,
      course: studentCourse?.code || 'BCA',
      department: studentDepartment?.name || 'Computer Applications',
    },
    semester: {
      number: semesterRecord.number,
      name: semesterRecord.name,
    },
    summary: {
      sgpa: calc.sgpa,
      percentage: calc.percentage,
      credits: calc.totalCredits,
      status: calc.status,
    },
  });
}