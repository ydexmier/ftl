import { NextRequest } from 'next/server';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';

const SECRET = process.env.SESSION_SECRET ?? 'CHANGE_ME_IN_PRODUCTION_32_CHARS!';
export const GUEST_COOKIE = 'guest_session';
// maxAge aligné sur le TTL d'inactivité de la session normale (8h)
export const GUEST_COOKIE_MAX_AGE = 8 * 60 * 60;

function toBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64url(s: string): ArrayBuffer {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export interface GuestSessionPayload {
  accessId: string;
  tournamentId: number;
  groupId: string;
  displayName: string;
}

export async function signGuestCookie(payload: GuestSessionPayload): Promise<string> {
  const data = [payload.accessId, payload.tournamentId, payload.groupId, payload.displayName].join('|');
  const sig = await crypto.subtle.sign('HMAC', await getKey(), new TextEncoder().encode(data));
  return data + '|' + toBase64url(sig);
}

export async function verifyGuestCookie(val: string): Promise<GuestSessionPayload | null> {
  const parts = val.split('|');
  // format: accessId|tournamentId|groupId|displayName|sig
  // displayName peut contenir des pipes → on extrait sig (dernier segment) et on reconstruit data
  if (parts.length < 5) return null;
  const sig = parts[parts.length - 1];
  const data = parts.slice(0, -1).join('|');
  const [accessId, tournamentIdStr, groupId, ...displayNameParts] = parts.slice(0, -1);
  const displayName = displayNameParts.join('|');
  const tournamentId = Number(tournamentIdStr);
  if (!accessId || isNaN(tournamentId) || !groupId || !displayName) return null;
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      fromBase64url(sig),
      new TextEncoder().encode(data),
    );
    return ok ? { accessId, tournamentId, groupId, displayName } : null;
  } catch {
    return null;
  }
}

export interface GuestSession {
  accessId: string;
  tournamentId: number;
  groupId: string;
  displayName: string;
}

/**
 * Extrait et valide la session invité depuis le cookie guest_session.
 * Vérifie également en DB que l'accès est toujours ACCEPTED et non expiré.
 */
export async function getGuestSession(request: NextRequest): Promise<GuestSession | null> {
  const val = request.cookies.get(GUEST_COOKIE)?.value;
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
