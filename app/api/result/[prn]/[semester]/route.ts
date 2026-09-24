import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayload, handleAuthError } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prn: string; semester: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    const { prn, semester } = await params;
    const semNumber = parseInt(semester, 10);

    const semesterRecord = await prisma.semester.findUnique({
      where: { number: semNumber },
    });

    if (!semesterRecord) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    // Determine the effective PRN to query
    let effectivePrn = prn.toUpperCase();

    // If student, enforce own PRN only
    if (auth && auth.role === 'STUDENT') {
      if (!auth.prn) {
        return NextResponse.json({ error: 'Student PRN not linked to account' }, { status: 403 });
      }
      effectivePrn = auth.prn;
    }

    const results = await prisma.result.findMany({
      where: {
        prn: effectivePrn,
        semesterId: semesterRecord.id,
      },
      include: {
        subject: true,
        semester: true,
        student: true,
      },
    });

    if (results.length === 0) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    // Student info from first result
    const student = results[0].student;

    return NextResponse.json({ prn: effectivePrn, semester: semNumber, results, student });
  } catch (e) {
    return handleAuthError(e);
  }
}