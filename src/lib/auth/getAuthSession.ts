import { NextRequest } from 'next/server';
import { verifyCookie } from './cookieSign';
import { getSession } from './session';

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
