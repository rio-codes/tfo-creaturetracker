import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/terms', '/privacy'];
const PROTECTED_ROUTES = [
    '/collection',
    '/breeding-pairs',
    '/research-goals',
    '/settings',
];
const ADMIN_ROUTES = ['/admin'];

export default auth((req) => {
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;
    const userRole = req.auth?.user?.role;

    const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);
    const isProtectedRoute =
        PROTECTED_ROUTES.some((route) => nextUrl.pathname.startsWith(route)) ||
        ADMIN_ROUTES.some((route) => nextUrl.pathname.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some((route) =>
        nextUrl.pathname.startsWith(route)
    );

    // If user is not authenticated and trying to access a protected route, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // If user is not an admin and trying to access an admin route, redirect
    if (isAdminRoute && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/collection', req.nextUrl));
    }

    // If user is authenticated, redirect them from public-only pages
    if (isAuthenticated && isPublicRoute) {
        return NextResponse.redirect(new URL('/collection', req.nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
