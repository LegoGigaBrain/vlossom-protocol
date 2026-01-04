import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * V8.0.0 Security Fix: Correct cookie name matching backend cookie-config.ts
 * Cookie names from services/api/src/lib/cookie-config.ts
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'vlossom_access',
  REFRESH_TOKEN: 'vlossom_refresh',
} as const;

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/onboarding", "/forgot-password", "/reset-password"];

// Protected routes that require authentication
const PROTECTED_PREFIXES = ["/wallet", "/bookings", "/stylists", "/book", "/stylist", "/profile", "/settings", "/messages"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // V8.0.0 Security Fix: Use correct cookie names from backend
  // Check for signed access token cookie (name matches backend cookie-config.ts)
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  // If no tokens and trying to access protected route, redirect to login
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (!accessToken && !refreshToken && isProtectedRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If user has token, we'll let the client-side handle role-based redirects
  // (useAuth hook handles this)
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
