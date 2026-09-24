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
  const departmentId = searchParams.get('departmentId')?.trim() || '';

  const where = departmentId ? { departmentId } : {};

  const courses = await prisma.course.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      department: true,
      _count: { select: { classYears: true } },
    },
  });

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      durationYears: c.durationYears,
      departmentId: c.departmentId,
      department: c.department
        ? {
            id: c.department.id,
            code: c.department.code,
            name: c.department.name,
          }
        : null,
      classYearCount: c._count.classYears,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}