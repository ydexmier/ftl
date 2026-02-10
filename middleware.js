import { NextResponse } from 'next/server';

export function middleware(req) {
	const url = req.nextUrl.clone();
	// 🔹 Protection admin
	if (url.pathname.startsWith('/admin')) {
		const isLoggedIn = req.cookies.get('adminAuth')?.value === 'true';

		// Si connecté et sur la page login → rediriger vers dashboard
		if (isLoggedIn && url.pathname === '/admin/login') {
			url.pathname = '/admin/dashboard';
			return NextResponse.redirect(url);
		}

		// Si pas connecté et pas sur login → rediriger vers login
		if (!isLoggedIn && url.pathname !== '/admin/login') {
			url.pathname = '/admin/login';
			return NextResponse.redirect(url);
		}
	}
	return NextResponse.next();
}

// ⚡ Matcher : admin + reste du site sauf API et assets
export const config = {
	matcher: ['/admin/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
