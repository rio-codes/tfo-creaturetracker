import NextAuth from 'next-auth';
import { NextResponse, NextRequest } from 'next/server'
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const { nextUrl } = req;

  if (isAuthenticated) {
    console.log("Logged in")
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
    "/research-goals"
  ]; 

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);

  // if the user is not logged in and trying to access a protected route, redirect them to the login page
  if (isProtectedRoute && !isAuthenticated) {
    console.log("User not logged in, accessing protected")
    return NextResponse.redirect(new URL('/login', nextUrl.origin));
  }

  // if the user is logged in and tries to access login or register, redirect to home
  if (isAuthenticated && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
    console.log("User logged in, redirecting")
    return NextResponse.redirect(new URL('/collection', nextUrl.origin));
  }

  // in all other cases, continue to path requested
  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',],
};
