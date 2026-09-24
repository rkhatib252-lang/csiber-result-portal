import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenName } from '@/lib/auth';

const ADMIN_PREFIXES = ['/admin', '/api/admin'];
const STUDENT_PREFIXES = ['/student', '/result', '/api/result'];
const PUBLIC_STUDENT_APIS = ['/api/result/verify'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_PREFIXES.some(p => pathname.startsWith(p));
  const isStudentRoute = STUDENT_PREFIXES.some(p => pathname.startsWith(p));
  const isPublicStudentAPI = PUBLIC_STUDENT_APIS.some(p => pathname.startsWith(p));

  if (!isAdminRoute && !isStudentRoute) return NextResponse.next();

  if (isStudentRoute && isPublicStudentAPI) return NextResponse.next();

  if (isAdminRoute) {
    return handleAdminAuth(request, pathname);
  }

  return handleStudentAuth(request, pathname);
}

async function handleAdminAuth(request: NextRequest, pathname: string) {
  const token = request.cookies.get(getTokenName())?.value;
  if (!token) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(getTokenName());
    return res;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.sub ?? ''));
  requestHeaders.set('x-user-role', String(payload.role ?? ''));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function handleStudentAuth(request: NextRequest, pathname: string) {
  const token = request.cookies.get(getTokenName())?.value;
  if (!token) {
    if (pathname.startsWith('/api/result')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/student/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'STUDENT') {
    if (pathname.startsWith('/api/result')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const loginUrl = new URL('/student/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(getTokenName());
    return res;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.sub ?? ''));
  requestHeaders.set('x-user-role', String(payload.role ?? ''));
  requestHeaders.set('x-user-prn', String(payload.prn ?? ''));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/student/:path*',
    '/result/:path*',
    '/api/result/:path*',
  ],
};