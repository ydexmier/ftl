import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import AuditLogModel from '@models/AuditLog';
import { invalidateSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (val) {
    const p = await verifyCookie(val);
    if (p) {
      await connectToMongoDB();
      await invalidateSession(p.sessionId);
      await AuditLogModel.create({ action: 'LOGOUT', ipAddress: 'unknown', userAgent: request.headers.get('user-agent') ?? '' });
    }
  }
  const res = ApiResponse.ok({ ok: true });
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}
