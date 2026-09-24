import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ prn: string }> }
) {
  const { prn } = await params;
  const student = await prisma.student.findUnique({
    where: { prn },
    include: {
      results: {
        include: {
          subject: true,
          semester: true,
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json(student);
}