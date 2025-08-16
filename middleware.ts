import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default ((req) => {
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;

    // Public routes
    const publicRoutes = [
      "/",
      "/login",
      "/register"
    ];
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

    // If the user is authenticated and trying to access a public route, redirect them
    if (isAuthenticated && isPublicRoute) {
      return Response.redirect(new URL("/collection", nextUrl)); // Redirect to a protected page
    }

    // If the user is not authenticated and trying to access a protected route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      // Add a callback URL to redirect back after successful login
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return Response.redirect(loginUrl);
    }

    // Allow all other requests
    return null;
  }
);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',],
};
