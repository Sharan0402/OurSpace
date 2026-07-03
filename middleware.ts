import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware for server-side route protection.
 *
 * In production (NEXT_PUBLIC_USE_MOCKS=false) this checks for the presence of a
 * session cookie set by the Cognito auth callback and redirects unauthenticated
 * visitors to /login before any protected page renders. The authoritative check
 * still happens in the Java backend (it validates the Cognito JWT and the
 * two-user allow-list on every request); this is a UX-level guard.
 *
 * In dev/mock mode auth is client-side (localStorage), so we let requests
 * through and rely on <ProtectedRoute> for redirection.
 */
const SESSION_COOKIE = "our-space.session";
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export function middleware(req: NextRequest) {
  if (USE_MOCKS) return NextResponse.next();

  const isProtected = req.nextUrl.pathname === "/";
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
