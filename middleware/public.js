// middleware.public.js
import { NextResponse } from 'next/server';

export function middleware(req) {
	const res = NextResponse.next();
	res.cookies.set('siteAuth', 'true', { httpOnly: true, path: '/' });
	return res;
}

export const config = {
	matcher: [
		'/', // page d'accueil
		'/tournaments/:path*', // autres pages publiques
		// ajouter d'autres routes publiques si besoin
	],
};
