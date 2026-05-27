import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { verifyGuestCookie, GUEST_COOKIE } from '@/src/lib/auth/guestSession';

const PUBLIC = ['/login', '/api/auth/login', '/api/auth/logout', '/forgot-password', '/api/auth/forgot-password', '/access-request', '/api/access-requests'];
const PUBLIC_PREFIXES = ['/register/', '/api/invitations/', '/reset-password/', '/api/auth/reset-password/', '/api/external/', '/guest/', '/api/guest/'];
const STATIC = ['/_next', '/favicon.ico', '/svg', '/images'];

// Routes accessibles depuis un cookie guest_session
const GUEST_ALLOWED_PAGE_PREFIX = '/tournaments/';
const GUEST_ALLOWED_API_PREFIXES = [
  '/api/rounds/',
  '/api/tournaments/',
];

function isPublic(p: string) {
  return STATIC.some(s => p.startsWith(s)) || PUBLIC.includes(p) || PUBLIC_PREFIXES.some(s => p.startsWith(s));
}

function isGuestAllowed(pathname: string, tournamentId: number): boolean {
  if (pathname === `${GUEST_ALLOWED_PAGE_PREFIX}${tournamentId}`) return true;
  if (pathname.startsWith(`${GUEST_ALLOWED_PAGE_PREFIX}${tournamentId}/`)) return true;
  if (GUEST_ALLOWED_API_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // ─── Vérification session normale ──────────────────────────────────────────
  const sessionVal = request.cookies.get('session')?.value;
  if (sessionVal) {
    const parsed = await verifyCookie(sessionVal);
    if (!parsed) {
      const u = request.nextUrl.clone();
      u.pathname = '/login';
      const r = NextResponse.redirect(u);
      r.cookies.set('session', '', { maxAge: 0, path: '/' });
      return r;
    }

    if (pathname === '/login') {
      const u = request.nextUrl.clone();
      u.pathname = parsed.role === 'ADMIN' || parsed.role === 'SUPERUSER' ? '/admin/dashboard' : '/';
      return NextResponse.redirect(u);
    }

    if (pathname.startsWith('/admin') && parsed.role !== 'ADMIN' && parsed.role !== 'SUPERUSER') {
      const u = request.nextUrl.clone();
      u.pathname = '/';
      return NextResponse.redirect(u);
    }

    const res = NextResponse.next();
    res.headers.set('x-user-id', parsed.sessionId);
    res.headers.set('x-user-role', parsed.role);
    return res;
  }

  // ─── Vérification session invité ────────────────────────────────────────────
  // Note : la vérification DB complète (statut ACCEPTED, non expiré) se fait
  // dans getGuestSession() au niveau des routes API — le middleware vérifie
  // uniquement la signature HMAC pour rester dans l'Edge Runtime.
  const guestVal = request.cookies.get(GUEST_COOKIE)?.value;
  if (guestVal) {
    const guest = await verifyGuestCookie(guestVal);
    if (guest && isGuestAllowed(pathname, guest.tournamentId)) {
      const res = NextResponse.next();
      res.headers.set('x-guest-access-id', guest.accessId);
      res.headers.set('x-guest-tournament-id', String(guest.tournamentId));
      res.headers.set('x-guest-group-id', guest.groupId);
      return res;
    }

    // Cookie invité invalide ou route non autorisée → page d'erreur dédiée
    const u = request.nextUrl.clone();
    u.pathname = '/login';
    return NextResponse.redirect(u);
  }

  // ─── Aucune session ─────────────────────────────────────────────────────────
  const u = request.nextUrl.clone();
  u.pathname = '/login';
  return NextResponse.redirect(u);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|svg/|images/).*)'],
};
