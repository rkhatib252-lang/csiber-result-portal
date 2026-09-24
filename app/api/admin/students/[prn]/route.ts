import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prn: string }> }
) {
  try {
    const admin = await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const { prn } = await params;
  const normalizedPrn = prn.toUpperCase();

  const student = await prisma.student.findUnique({
    where: { prn: normalizedPrn },
    include: {
      classYear: {
        include: {
          course: {
            include: { department: true },
          },
        },
      },
      user: {
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      },
      results: {
        include: {
          subject: true,
          semester: true,
        },
        orderBy: { semester: { number: 'asc' } },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const semestersWithResults = new Set(student.results.map((r) => r.semesterId));
  const resultCount = student.results.length;
  const semesterCount = semestersWithResults.size;

  return NextResponse.json({
    prn: student.prn,
    name: student.name,
    email: student.email,
    batch: student.batch,
    classYear: student.classYear
      ? {
          id: student.classYear.id,
          name: student.classYear.name,
          year: student.classYear.year,
          course: student.classYear.course
            ? {
                id: student.classYear.course.id,
                code: student.classYear.course.code,
                name: student.classYear.course.name,
                department: student.classYear.course.department
                  ? {
                      id: student.classYear.course.department.id,
                      code: student.classYear.course.department.code,
                      name: student.classYear.course.department.name,
                    }
                  : null,
              }
            : null,
        }
      : null,
    user: student.user,
    createdBy: student.createdBy,
    createdAt: student.createdAt,
    changedBy: student.changedBy,
    changedAt: student.changedAt,
    academicSummary: {
      resultCount,
      semesterCount,
      hasAcademicRecords: resultCount > 0,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ prn: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { prn } = await params;
    const normalizedPrn = prn.toUpperCase();

    const existing = await prisma.student.findUnique({ where: { prn: normalizedPrn } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, email, batch, classYearId, departmentId, courseId } = body as {
      name?: string;
      email?: string;
      batch?: string;
      classYearId?: string;
      departmentId?: string;
      courseId?: string;
    };

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Student name cannot be empty' }, { status: 400 });
      }
    }

    if (email !== undefined) {
      const emailValue = email?.trim() || null;
      if (emailValue && emailValue !== existing.email) {
        const emailExists = await prisma.student.findUnique({ where: { email: emailValue } });
        if (emailExists) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
        }
      }
    }

    if (batch !== undefined) {
      if (!batch || !batch.trim()) {
        return NextResponse.json({ error: 'Admission year cannot be empty' }, { status: 400 });
      }
    }

    if (classYearId !== undefined) {
      if (!classYearId || !classYearId.trim()) {
        return NextResponse.json({ error: 'Class/Year cannot be empty' }, { status: 400 });
      }
      const classYear = await prisma.classYear.findUnique({
        where: { id: classYearId },
        include: { course: { include: { department: true } } },
      });
      if (!classYear) {
        return NextResponse.json({ error: 'Invalid Class/Year' }, { status: 400 });
      }
      if (departmentId && classYear.course.departmentId !== departmentId) {
        return NextResponse.json({ error: 'Class/Year does not belong to the selected Department' }, { status: 400 });
      }
      if (courseId && classYear.courseId !== courseId) {
        return NextResponse.json({ error: 'Class/Year does not belong to the selected Course' }, { status: 400 });
      }
    }

    const student = await prisma.student.update({
      where: { prn: normalizedPrn },
      data: {
        name: name?.trim(),
        email: email?.trim() || null,
        batch: batch?.trim(),
        classYearId,
        changedBy: admin.name || admin.email,
        changedAt: new Date(),
      },
      include: {
        classYear: {
          include: {
            course: {
              include: { department: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      prn: student.prn,
      name: student.name,
      email: student.email,
      batch: student.batch,
      classYear: student.classYear
        ? {
            id: student.classYear.id,
            name: student.classYear.name,
            year: student.classYear.year,
            course: student.classYear.course
              ? {
                  id: student.classYear.course.id,
                  code: student.classYear.course.code,
                  name: student.classYear.course.name,
                  department: student.classYear.course.department
                    ? {
                        id: student.classYear.course.department.id,
                        code: student.classYear.course.department.code,
                        name: student.classYear.course.department.name,
                      }
                    : null,
                }
              : null,
          }
        : null,
      createdBy: student.createdBy,
      createdAt: student.createdAt,
      changedBy: student.changedBy,
      changedAt: student.changedAt,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ prn: string }> }
) {
  try {
    const admin = await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const { prn } = await params;
  const normalizedPrn = prn.toUpperCase();

  const student = await prisma.student.findUnique({
    where: { prn: normalizedPrn },
    include: { _count: { select: { results: true } } },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  if (student._count.results > 0) {
    return NextResponse.json(
      { error: 'Student cannot be deleted because academic result records exist.' },
      { status: 409 }
    );
  }

  await prisma.student.delete({ where: { prn: normalizedPrn } });

  return NextResponse.json({ ok: true });
}