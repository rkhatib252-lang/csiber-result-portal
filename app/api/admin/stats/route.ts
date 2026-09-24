import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const totalStudents = await prisma.student.count();
  const totalResults = await prisma.result.count();
  const totalSubjects = await prisma.subject.count();
  const totalSemesters = await prisma.semester.count();

  const resultsPerSemester = await prisma.result.groupBy({
    by: ['semesterId'],
    _count: { id: true },
  });

  const semesters = await prisma.semester.findMany({
    where: { id: { in: resultsPerSemester.map(r => r.semesterId) } },
  });

  const semesterStats = resultsPerSemester.map(r => {
    const sem = semesters.find(s => s.id === r.semesterId);
    return { semester: sem?.number ?? r.semesterId, count: r._count.id };
  });

  // Compute pass/fail/ATKT stats from results
  const allResults = await prisma.result.findMany({
    select: { remark: true, grade: true },
  });

  const passed = allResults.filter(r => r.remark === 'PASS' || r.grade === 'O' || r.grade === 'A+' || r.grade === 'A' || r.grade === 'B+' || r.grade === 'B' || r.grade === 'C' || r.grade === 'P').length;
  const failed = allResults.filter(r => r.remark === 'FAIL' || r.grade === 'F').length;
  const atkt = allResults.filter(r => r.remark === 'ATKT').length;

  return NextResponse.json({
    totalStudents,
    totalResults,
    totalSubjects,
    totalSemesters,
    semesterStats,
    passed,
    failed,
    atkt,
  });
}