import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { signCookie } from '@/src/lib/auth/cookieSign';
import { SESSION_COOKIE_MAX_AGE } from '@/src/lib/auth/session';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized('Session expirée');

  const cookieValue = await signCookie(session.sessionId, session.role);
  const res = NextResponse.json({}, { status: 200 });
  res.cookies.set('session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
