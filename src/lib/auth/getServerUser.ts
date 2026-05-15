import { cookies } from 'next/headers';
import { verifyCookie } from './cookieSign';
import { getSession } from './session';

export async function getServerUser() {
  const cookieStore = await cookies();
  const val = cookieStore.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);
  if (!parsed) return null;
  const session = await getSession(parsed.sessionId);
  if (!session) return null;
  return { userId: String(session.userId), role: parsed.role };
}
