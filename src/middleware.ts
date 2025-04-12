import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Define protected routes and their role requirements
const protectedRoutes = [
  {
    path: '/dashboard',
    roles: ['ADMIN', 'RETAILER'],
    requireVerification: true,
  },
  {
    path: '/dashboard/retailer-applications',
    roles: ['ADMIN'],
    requireVerification: true,
  },
  {
    path: '/dashboard/products',
    roles: ['ADMIN', 'RETAILER'],
    requireVerification: true,
  },
];

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Create the auth middleware
const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // If no token, user will be redirected to login by NextAuth
    if (!token) {
      return null;
    }

    // Find the protected route configuration that matches the current path
    const matchedRoute = protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );

    if (matchedRoute) {
      // Check if email verification is required and user's email is not verified
      if (matchedRoute.requireVerification && !token.emailVerified) {
        return NextResponse.redirect(new URL('/verify-required', req.url));
      }

      // Check if user has the required role for this route
      if (!matchedRoute.roles.includes(token.role as string)) {
        // If user is not ADMIN or RETAILER, redirect them to home page
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Combined middleware using a chain of middleware functions
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // For dashboard routes, apply auth middleware
  if (pathname.startsWith('/dashboard')) {
    // We need to directly export the withAuth result for these routes
    return authMiddleware(req as any, event);
  }

  // For all other routes, apply intl middleware
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - API routes, Next.js internals, Vercel internals, or files with extensions
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
    // Explicitly include dashboard routes for auth middleware
    '/dashboard/:path*',
  ],
};