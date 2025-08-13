
import { NextResponse } from 'next/server';

export function middleware(request) {
  // This is a simplified check. In a real app, you'd verify a Firebase ID token.
  const isAuthenticated = request.cookies.get('loggedIn')?.value === 'true';

  const protectedRoutes = ['/dashboard', '/nouvelle-boutique'];

  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login'; // Redirect to /login as per prompt
      return NextResponse.redirect(url);
    }
  }

  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/nouvelle-boutique/:path*'],
};
