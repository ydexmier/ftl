// middleware.admin.js
import { NextResponse } from "next/server";
import * as cookie from "cookie";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  const isLoggedIn = cookies.adminAuth === "true";

  // Redirige vers login si pas connecté
  if (!isLoggedIn && !url.pathname.startsWith("/admin/login")) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Bloque l'accès à /admin/login si déjà connecté
  if (isLoggedIn && url.pathname === "/admin/login") {
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
