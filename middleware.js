import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
console.log("Middleware triggered for URL:", url.pathname, url.pathname.startsWith("/admin"));
  // 🔹 Protection admin
  if (url.pathname.startsWith("/admin")) {
    const isLoggedIn = req.cookies.get("adminAuth")?.value === "true";

    // Si connecté et sur la page login → rediriger vers dashboard
    if (isLoggedIn && url.pathname === "/admin/login") {
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }

    // Si pas connecté et pas sur login → rediriger vers login
    if (!isLoggedIn && url.pathname !== "/admin/login") {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 🔹 Protection publique avec Basic Auth
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [user, password] = credentials.split(":");

  const USERNAME = process.env.WEBSITE_ACCESS_LOGIN || "";
  const PASSWORD = process.env.WEBSITE_ACCESS_PASSWORD || "";

  if (user === USERNAME && password === PASSWORD) {
    return NextResponse.next();
  }

  return new Response("Access denied", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

// ⚡ Matcher : admin + reste du site sauf API et assets
export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
