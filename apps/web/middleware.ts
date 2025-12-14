import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/onboarding"];

// Protected routes that require authentication
const PROTECTED_PREFIXES = ["/wallet", "/bookings", "/stylists", "/book", "/stylist"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from localStorage (client-side only)
  // For server-side middleware, we check if user is trying to access protected routes
  // and redirect to login if they don't have a token cookie

  const token = request.cookies.get("vlossomToken")?.value;

  // If no token and trying to access protected route, redirect to login
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (!token && isProtectedRoute) {
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
