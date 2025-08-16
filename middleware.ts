export default ((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // Public routes
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/terms",
    "/privacy"
  ];
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // If the route is public, allow the user to access the page
  if (isPublicRoute) {
    return null
  }
  else {
    // If the user is authenticated and it is not a public route, allow access
    if (isAuthenticated) {
      return null
    }
    // If the user is not authenicated and it is not a public route, redirect to login
    else {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return Response.redirect(loginUrl);
    }
  }
})

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',],
};
