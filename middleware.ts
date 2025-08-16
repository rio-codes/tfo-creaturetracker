import { NextResponse, NextRequest } from 'next/server'

export default ((req: NextRequest) => {
  const { nextUrl } = req;
  const isAuthenticated = req.cookies.has('__Host-next-auth.csrf-token');

  // Public routes
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/terms",
    "/privacy"
  ];

  const protectedRoutes = [
    "/home", 
    "/collection", 
    "/breeding-pairs", 
    "/research-goals"
  ]; 

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isProtectedRoute = protectedRoutes.some(path => nextUrl.pathname.startsWith(path));

  // if the user is not logged in and trying to access a protected route, redirect them to the login page
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', nextUrl.origin));
  }

  // if the user is logged in and tries to access login or register, redirect to home
  if (isAuthenticated && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/home', nextUrl.origin));
  }

  // in all other cases, continue to path requested
  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',],
};
