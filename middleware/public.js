// middleware.public.js
import { NextResponse } from "next/server";
import * as cookie from "cookie";

export function middleware(req) {
  const cookies = cookie.parse(req.headers.get("cookie") || "");

  // Si cookie présent → accès autorisé
  if (cookies.siteAuth === "true") {
    return NextResponse.next();
  }

  // Vérifie Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const [user, password] = Buffer.from(base64Credentials, "base64")
    .toString("ascii")
    .split(":");

  const USERNAME = process.env.WEBSITE_ACCESS_LOGIN || "";
  const PASSWORD = process.env.WEBSITE_ACCESS_PASSWORD || "";

  if (user === USERNAME && password === PASSWORD) {
    const res = NextResponse.next();
    res.cookies.set("siteAuth", "true", { httpOnly: true, path: "/" });
    return res;
  }

  return new Response("Access denied", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}

export const config = {
  matcher: [
    "/",               // page d'accueil
    "/tournaments/:path*", // autres pages publiques
    // ajouter d'autres routes publiques si besoin
  ],
};
