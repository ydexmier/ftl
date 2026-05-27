import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyCookie } from '@/src/lib/auth/cookieSign';

const PUBLIC = ['/login', '/api/auth/login', '/api/auth/logout', '/forgot-password', '/api/auth/forgot-password', '/access-request', '/api/access-requests'];
const PUBLIC_PREFIXES = ['/register/', '/api/invitations/', '/reset-password/', '/api/auth/reset-password/', '/api/external/'];
const STATIC = ['/_next', '/favicon.ico', '/svg', '/images'];

function isPublic(p: string) {
  return STATIC.some(s => p.startsWith(s)) || PUBLIC.includes(p) || PUBLIC_PREFIXES.some(s => p.startsWith(s));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const val = request.cookies.get('session')?.value;
  if (!val) {
    const u = request.nextUrl.clone();
    u.pathname = '/login';
    return NextResponse.redirect(u);
  }

  const parsed = await verifyCookie(val);
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|svg/|images/).*)'],
};
