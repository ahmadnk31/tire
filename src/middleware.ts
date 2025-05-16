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

    // Check if the current route is protected
    const matchedRoute = protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );

    if (matchedRoute) {
      // Check role requirements
      if (!matchedRoute.roles.includes(token.role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Check email verification if required
      if (matchedRoute.requireVerification && !token.emailVerified) {
        return NextResponse.redirect(new URL('/verify-email', req.url));
      }
    }

    // Use user's preferred language if available
    if (token.preferredLanguage && !pathname.startsWith(`/${token.preferredLanguage}`)) {
      // Only redirect if the current locale is different from the preferred language
      const currentLocale = pathname.split('/')[1];
      if (currentLocale !== token.preferredLanguage) {
        const newUrl = new URL(req.url);
        newUrl.pathname = `/${token.preferredLanguage}${pathname}`;
        return NextResponse.redirect(newUrl);
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