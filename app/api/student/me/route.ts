import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayload, handleAuthError } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);

    if (!auth || auth.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!auth.prn) {
      return NextResponse.json({ error: 'Student PRN not linked to account' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { prn: auth.prn },
      include: {
        results: {
          include: {
            subject: true,
            semester: true,
          },
          orderBy: {
            semester: {
              number: 'asc',
            },
          },
        },
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
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (e) {
    return handleAuthError(e);
  }
}
