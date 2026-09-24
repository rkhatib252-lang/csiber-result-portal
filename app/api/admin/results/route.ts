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
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const search = searchParams.get('search')?.trim() || '';
  const semester = searchParams.get('semester') ? parseInt(searchParams.get('semester')!, 10) : null;
  const department = searchParams.get('department')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';

  const where: any = {};

  if (search) {
    where.OR = [
      { prn: { contains: search, mode: 'insensitive' } },
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { subject: { code: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (semester) {
    where.semester = { number: semester };
  }
  if (department) {
    where.student = { department: { equals: department, mode: 'insensitive' } };
  }
  // status filtering would need computed field; skip for now

  const [results, total] = await Promise.all([
    prisma.result.findMany({
      where,
      include: {
        student: true,
        subject: true,
        semester: true,
      },
      orderBy: [{ semester: { number: 'asc' } }, { subject: { code: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.result.count({ where }),
  ]);

  return NextResponse.json({
    results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}