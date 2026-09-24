import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { courses: true } },
    },
  });

  return NextResponse.json({
    departments: departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      courseCount: d._count.courses,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  });
}