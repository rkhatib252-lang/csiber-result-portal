import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenName } from '@/lib/auth';

export interface AuthPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  prn?: string;
}

export async function getAuthPayload(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get(getTokenName())?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return {
    sub: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
    name: String(payload.name ?? ''),
    role: String(payload.role ?? ''),
    prn: payload.prn ? String(payload.prn) : undefined,
  };
}

export async function requireAuth(request: NextRequest): Promise<AuthPayload> {
  const payload = await getAuthPayload(request);
  if (!payload) {
    throw new Error('UNAUTHORIZED');
  }
  return payload;
}

export async function requireAdmin(request: NextRequest): Promise<AuthPayload> {
  const payload = await requireAuth(request);
  if (payload.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return payload;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse();
  }
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}