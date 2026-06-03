import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/security";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass public assets and auth API endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("lifeos_session");
  const systemSecret = process.env.SESSION_SECRET || "default-secret-string-at-least-32-chars";

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isValid = await verifySessionToken(sessionCookie.value, systemSecret);

  if (!isValid) {
    // Force deletion of corrupted/invalid session cookie
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("lifeos_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api/auth/login|api/auth/logout).*)",
};
