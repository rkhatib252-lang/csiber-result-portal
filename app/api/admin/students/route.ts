import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
  const search = searchParams.get('search')?.trim() || '';
  const useRegex = searchParams.get('regex') === 'true';
  const caseSensitive = searchParams.get('caseSensitive') === 'true';
  const departmentId = searchParams.get('departmentId')?.trim() || '';
  const courseId = searchParams.get('courseId')?.trim() || '';
  const classYearId = searchParams.get('classYearId')?.trim() || '';
  const admissionYear = searchParams.get('admissionYear')?.trim() || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  const allowedSortFields = ['createdAt', 'name', 'prn', 'batch', 'updatedAt'];
  const safeSort = allowedSortFields.includes(sort) ? sort : 'createdAt';
  const safeOrder = order === 'asc' ? 'asc' : 'desc';

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  if (useRegex && search) {
    try {
      new RegExp(search);
    } catch {
      return NextResponse.json({ error: 'Invalid regular expression' }, { status: 400 });
    }

    const regexFlags = caseSensitive ? '' : 'i';
    const searchPattern = search;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (searchPattern) {
      const regexOp = caseSensitive ? '~' : '~*';
      whereClauses.push(`(s.name ${regexOp} $${queryParams.length + 1} OR s.prn ${regexOp} $${queryParams.length + 1})`);
      queryParams.push(searchPattern);
    }

    if (admissionYear) {
      whereClauses.push(`s.batch = $${queryParams.length + 1}`);
      queryParams.push(admissionYear);
    }

    if (classYearId) {
      whereClauses.push(`s.class_year_id = $${queryParams.length + 1}`);
      queryParams.push(classYearId);
    } else if (courseId) {
      whereClauses.push(`cy.course_id = $${queryParams.length + 1}`);
      queryParams.push(courseId);
    } else if (departmentId) {
      whereClauses.push(`c.department_id = $${queryParams.length + 1}`);
      queryParams.push(departmentId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = Prisma.sql`
      SELECT COUNT(*)
      FROM "Student" s
      LEFT JOIN "ClassYear" cy ON s.class_year_id = cy.id
      LEFT JOIN "Course" c ON cy.course_id = c.id
      ${Prisma.raw(whereSql)}
    `;

    const dataQuery = Prisma.sql`
      SELECT
        s.prn, s.name, s.email, s.batch, s.class_year_id, s.created_by, s.created_at, s.changed_by, s.changed_at,
        cy.id as cy_id, cy.name as cy_name, cy.year as cy_year, cy.course_id as cy_course_id,
        c.id as c_id, c.code as c_code, c.name as c_name, c.department_id as c_dept_id,
        d.id as d_id, d.code as d_code, d.name as d_name,
        u.id as u_id, u.email as u_email, u.name as u_name, u.role as u_role,
        (SELECT COUNT(*) FROM "Result" r WHERE r.prn = s.prn) as result_count
      FROM "Student" s
      LEFT JOIN "ClassYear" cy ON s.class_year_id = cy.id
      LEFT JOIN "Course" c ON cy.course_id = c.id
      LEFT JOIN "Department" d ON c.department_id = d.id
      LEFT JOIN "User" u ON s.user_id = u.id
      ${Prisma.raw(whereSql)}
      ORDER BY s.${Prisma.raw(safeSort)} ${Prisma.raw(safeOrder)}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(take, skip);

    const [countResult, studentsRaw] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>(countQuery, ...queryParams.slice(0, -2)),
      prisma.$queryRaw<any[]>(dataQuery, ...queryParams),
    ]);

    const total = Number(countResult[0]?.count || 0);

    const students = studentsRaw.map((row) => ({
      prn: row.prn,
      name: row.name,
      email: row.email,
      batch: row.batch,
      classYear: row.cy_id
        ? {
            id: row.cy_id,
            name: row.cy_name,
            year: row.cy_year,
            course: row.c_id
              ? {
                  id: row.c_id,
                  code: row.c_code,
                  name: row.c_name,
                  department: row.d_id
                    ? {
                        id: row.d_id,
                        code: row.d_code,
                        name: row.d_name,
                      }
                    : null,
                }
              : null,
          }
        : null,
      user: row.u_id
        ? {
            id: row.u_id,
            email: row.u_email,
            name: row.u_name,
            role: row.u_role,
          }
        : null,
      createdBy: row.created_by,
      createdAt: row.created_at,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
      resultCount: Number(row.result_count || 0),
    }));

    return NextResponse.json({
      students,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }

  const where: any = {};

  if (search) {
    const mode = caseSensitive ? undefined : 'insensitive';
    where.OR = [
      { name: { contains: search, ...(mode && { mode }) } },
      { prn: { contains: search, ...(mode && { mode }) } },
    ];
  }

  if (admissionYear) {
    where.batch = admissionYear;
  }

  if (classYearId) {
    where.classYearId = classYearId;
  } else if (courseId) {
    where.classYear = { courseId };
  } else if (departmentId) {
    where.classYear = { course: { departmentId } };
  }

  const orderBy: any = {};
  orderBy[safeSort] = safeOrder;

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
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
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        _count: {
          select: { results: true },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    students: students.map((s) => ({
      prn: s.prn,
      name: s.name,
      email: s.email,
      batch: s.batch,
      classYear: s.classYear
        ? {
            id: s.classYear.id,
            name: s.classYear.name,
            year: s.classYear.year,
            course: s.classYear.course
              ? {
                  id: s.classYear.course.id,
                  code: s.classYear.course.code,
                  name: s.classYear.course.name,
                  department: s.classYear.course.department
                    ? {
                        id: s.classYear.course.department.id,
                        code: s.classYear.course.department.code,
                        name: s.classYear.course.department.name,
                      }
                    : null,
                }
              : null,
          }
        : null,
      user: s.user,
      createdBy: s.createdBy,
      createdAt: s.createdAt,
      changedBy: s.changedBy,
      changedAt: s.changedAt,
      resultCount: s._count.results,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, prn, email, batch, classYearId, departmentId, courseId } = body as {
      name?: string;
      prn?: string;
      email?: string;
      batch?: string;
      classYearId?: string;
      departmentId?: string;
      courseId?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
    }
    if (!prn || !prn.trim()) {
      return NextResponse.json({ error: 'PRN is required' }, { status: 400 });
    }
    if (!batch || !batch.trim()) {
      return NextResponse.json({ error: 'Admission year is required' }, { status: 400 });
    }
    if (!classYearId || !classYearId.trim()) {
      return NextResponse.json({ error: 'Class/Year is required' }, { status: 400 });
    }

    const normalizedPrn = prn.trim().toUpperCase();
    const existing = await prisma.student.findUnique({ where: { prn: normalizedPrn } });
    if (existing) {
      return NextResponse.json({ error: 'PRN already exists' }, { status: 409 });
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

    const emailValue = email?.trim() || null;
    if (emailValue) {
      const emailExists = await prisma.student.findUnique({ where: { email: emailValue } });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const student = await prisma.student.create({
      data: {
        prn: normalizedPrn,
        name: name.trim(),
        email: emailValue,
        batch: batch.trim(),
        classYearId: classYearId,
        createdBy: admin.name || admin.email,
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

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (e) {
    return handleAuthError(e);
  }
}