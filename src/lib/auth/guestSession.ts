import { NextRequest } from 'next/server';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { verifyGuestCookie } from './guestCookie';

export { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE, signGuestCookie, verifyGuestCookie } from './guestCookie';
export type { GuestSessionPayload } from './guestCookie';

export interface GuestSession {
  accessId: string;
  tournamentId: number;
  groupId: string;
  displayName: string;
}

export async function getGuestSession(request: NextRequest): Promise<GuestSession | null> {
  const val = request.cookies.get('guest_session')?.value;
  if (!val) return null;
  const payload = await verifyGuestCookie(val);
  if (!payload) return null;

  const access = await TournamentExternalAccessRepository.findById(payload.accessId);
  if (!access) return null;
  if (access.status !== 'ACCEPTED') return null;
  if (access.expiresAt < new Date()) return null;

  return {
    accessId: payload.accessId,
    tournamentId: payload.tournamentId,
    groupId: payload.groupId,
    displayName: payload.displayName,
  };
}
