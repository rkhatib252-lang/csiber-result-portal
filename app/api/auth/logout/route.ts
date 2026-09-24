import { NextResponse } from 'next/server';
import { getTokenName } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getTokenName());
  return response;
}