import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode('dev-secret-change-me');
  }
  return new TextEncoder().encode(secret);
}

const TOKEN_NAME = process.env.AUTH_COOKIE_NAME || 'csiber_auth';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getAuthSecret());
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload;
  } catch {
    return null;
  }
}

export function getTokenName(): string {
  return TOKEN_NAME;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8,
    path: '/',
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePRN(prn: string): string {
  return prn.trim().toUpperCase();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}