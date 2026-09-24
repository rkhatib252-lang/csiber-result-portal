import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken, getTokenName, getCookieOptions, normalizePRN } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prn, password } = body as { prn?: string; password?: string };

    if (!prn || !password) {
      return NextResponse.json({ error: 'PRN and password required' }, { status: 400 });
    }

    const normalizedPrn = normalizePRN(prn);

    const student = await prisma.student.findUnique({
      where: { prn: normalizedPrn },
      include: { user: true },
    });

    if (!student || !student.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, student.user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (student.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createToken({
      sub: student.user.id,
      email: student.user.email,
      role: student.user.role,
      name: student.user.name,
      prn: student.prn,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: student.user.id,
        email: student.user.email,
        name: student.user.name,
        role: student.user.role,
        prn: student.prn,
      },
    });
    response.cookies.set(getTokenName(), token, getCookieOptions());
    return response;
  } catch (e) {
    console.error('Student login error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}