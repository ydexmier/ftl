import { NextRequest, NextResponse } from 'next/server';
import { verifyCookie } from './cookieSign';
import { getSession } from './session';
import { hasRole } from './rbac';
import type { UserRole } from '@models/User';
import { ApiResponse } from '@/src/lib/api/responses';

export interface AuthSession {
  userId: string;
  role: string;
  sessionId: string;
}

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  const val = request.cookies.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);
  if (!parsed) return null;
  const session = await getSession(parsed.sessionId);
  if (!session) return null;
  return {
    userId: String(session.userId),
    role: parsed.role,
    sessionId: parsed.sessionId,
  };
}

export async function requireAdminSession(
  request: NextRequest,
): Promise<{ session: AuthSession } | { error: NextResponse }> {
  const session = await getAuthSession(request);
  if (!session) return { error: ApiResponse.unauthorized() };
  if (!hasRole(session.role as UserRole, 'ADMIN')) return { error: ApiResponse.forbidden() };
  return { session };
}
