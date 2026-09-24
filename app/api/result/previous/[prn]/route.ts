import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayload, handleAuthError } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prn: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    const { prn } = await params;

    // Determine the effective PRN to query
    let effectivePrn = prn.toUpperCase();

    // If student, enforce own PRN only
    if (auth && auth.role === 'STUDENT') {
      if (!auth.prn) {
        return NextResponse.json({ error: 'Student PRN not linked to account' }, { status: 403 });
      }
      effectivePrn = auth.prn;
    }

    const student = await prisma.student.findUnique({
      where: { prn: effectivePrn },
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
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Group by semester
    const grouped = student.results.reduce((acc, r) => {
      const sem = r.semester.number;
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(r);
      return acc;
    }, {} as Record<number, typeof student.results>);

    return NextResponse.json({ prn: effectivePrn, semesters: grouped });
  } catch (e) {
    return handleAuthError(e);
  }
}