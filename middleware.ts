import NextAuth from 'next-auth';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect a group of routes
  const protectedRoutes = [
    "/breeding-pairs",
    "/collection",
    "/research-goals"
  ];

  // Check if the current path is one of the protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If the user is trying to access a protected route
  if (isProtectedRoute) {
    // And they are NOT logged in, redirect them to the sign-in page
    if (!isLoggedIn) {
      const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
      // Add a callbackUrl so the user is redirected back to the page they were
      // trying to access after they successfully log in.
      signInUrl.searchParams.append("callbackUrl", req.url);
      return Response.redirect(signInUrl);
    }
  }

  // Allow all other requests
  return;
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',],
};
