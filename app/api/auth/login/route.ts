import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { verifyPassword } from '@/src/lib/auth/password';
import { createSession, SESSION_COOKIE_MAX_AGE } from '@/src/lib/auth/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/src/lib/auth/rateLimit';
import { signCookie } from '@/src/lib/auth/cookieSign';
import { ApiResponse } from '@/src/lib/api/responses';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getIp(request), ua = request.headers.get('user-agent') ?? '';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de tentatives.' }, { status: 429 });

  const { username, password } = await request.json();
  const user = await UserRepository.findByUsername(username?.toLowerCase() ?? '');
  const ERR = { error: 'Identifiants invalides' };

  if (!user) {
    recordFailedAttempt(ip);
    await AuditLogRepository.create({ action: 'LOGIN_FAIL', username: username ?? '', ipAddress: ip, userAgent: ua });
    return NextResponse.json(ERR, { status: 401 });
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    recordFailedAttempt(ip);
    await AuditLogRepository.create({ action: 'LOGIN_FAIL', userId: user._id, username: user.username, ipAddress: ip, userAgent: ua });
    return NextResponse.json(ERR, { status: 401 });
  }

  resetRateLimit(ip);
  const sessionId = await createSession(String(user._id), user.role, ip, ua);
  const cookieValue = await signCookie(sessionId, user.role);
  await AuditLogRepository.create({ action: 'LOGIN_SUCCESS', userId: user._id, username: user.username, ipAddress: ip, userAgent: ua });

  const needsOnboarding = user.role === 'USER' && user.onboardingCompletedAt === null;
  const res = ApiResponse.ok({ role: user.role, needsOnboarding });
  res.cookies.set('session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
