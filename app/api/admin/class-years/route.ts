import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId')?.trim() || '';

  const where = courseId ? { courseId } : {};

  const classYears = await prisma.classYear.findMany({
    where,
    orderBy: [{ course: { name: 'asc' } }, { year: 'asc' }],
    include: {
      course: {
        include: { department: true },
      },
      _count: { select: { students: true } },
    },
  });

  return NextResponse.json({
    classYears: classYears.map((cy) => ({
      id: cy.id,
      name: cy.name,
      year: cy.year,
      courseId: cy.courseId,
      course: cy.course
        ? {
            id: cy.course.id,
            code: cy.course.code,
            name: cy.course.name,
            department: cy.course.department
              ? {
                  id: cy.course.department.id,
                  code: cy.course.department.code,
                  name: cy.course.department.name,
                }
              : null,
          }
        : null,
      studentCount: cy._count.students,
      createdAt: cy.createdAt,
      updatedAt: cy.updatedAt,
    })),
  });
}