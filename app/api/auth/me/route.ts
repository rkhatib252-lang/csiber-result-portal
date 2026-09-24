import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenName } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getTokenName())?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { id: payload.sub, email: payload.email, name: payload.name, role: payload.role } });
}