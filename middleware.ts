import NextAuth from 'next-auth';
import { NextResponse, NextRequest } from 'next/server'
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest) => {
  const reqPath = req.nextUrl.pathname;
  var isAuthenticated: boolean = false;

  if (req.auth) {
    isAuthenticated = true;
    console.log("Logged in")
  }
  else {
    console.log("Logged out")
  }

  // Public routes
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/terms",
    "/privacy"
  ];

  const protectedRoutes = [
    "/collection", 
    "/breeding-pairs", 
    "/research-goals",
    "/settings"
  ]; 

  const isProtectedRoute = protectedRoutes.includes(reqPath);

  // if the user is not logged in and trying to access a protected route, redirect them to the login page
  if (isProtectedRoute && !isAuthenticated) {
    console.log("User not logged in, accessing protected")
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  // if the user is logged in and tries to access login or register, redirect to home
  if (isAuthenticated && (reqPath.includes('login') || reqPath.includes('register') || reqPath == "/")) {
    console.log("User logged in, redirecting")
    return NextResponse.redirect(new URL('/collection', req.nextUrl.origin));
  }

  // in all other cases, continue to path requested
  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',],
};
