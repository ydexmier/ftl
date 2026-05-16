import { v4 as uuidv4 } from 'uuid';
import connectToMongoDB from '@/src/lib/db';
import SessionModel from '@models/Session';

const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const INACTIVITY_MS = 4 * 60 * 60 * 1000;
// Le cookie expire en même temps que la fenêtre d'inactivité DB — les deux horloges sont synchronisées.
// Le SessionGuard client renouvelle le cookie toutes les 4 min quand l'onglet est actif.
export const SESSION_COOKIE_MAX_AGE = 4 * 60 * 60; // 4h, en secondes

export async function createSession(userId: string, role: string, ip: string, ua: string): Promise<string> {
  await connectToMongoDB();
  const sessionId = uuidv4();
  const now = new Date();
  await SessionModel.create({
    sessionId,
    userId,
    role,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + MAX_AGE_MS),
    ipAddress: ip,
    userAgent: ua,
  });
  return sessionId;
}

export async function getSession(sessionId: string) {
  await connectToMongoDB();
  const session = await SessionModel.findOne({ sessionId }).lean();
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() < now || now - session.lastActivityAt.getTime() > INACTIVITY_MS) {
    await SessionModel.deleteOne({ sessionId });
    return null;
  }
  await SessionModel.updateOne({ sessionId }, { lastActivityAt: new Date() });
  return session;
}

export async function invalidateSession(sessionId: string) {
  await connectToMongoDB();
  await SessionModel.deleteOne({ sessionId });
}
