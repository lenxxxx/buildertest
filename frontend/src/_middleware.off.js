import { NextResponse } from 'next/server';

// Ce middleware vérifie si l'utilisateur est authentifié
// en inspectant un cookie (ici, 'user-token').
// NOTE : Firebase Auth gère l'état côté client, donc un middleware
// est surtout utile pour la protection des pages rendues côté serveur
// ou pour une première barrière avant le rendu client.

export function middleware(request) {
  console.log('[MW] Middleware triggered for:', request.nextUrl.pathname);
  const token = request.cookies.get('token')?.value;
  console.log('[MW] Token found:', !!token);

  // if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   console.warn('[MW] No token, redirecting to /login from:', request.nextUrl.pathname);
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  // if (token && request.nextUrl.pathname === '/login') {
  //   console.log('[MW] Token found on /login, redirecting to /dashboard');
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  console.info('[MW] allow →', request.nextUrl.pathname);
  return NextResponse.next();
}

// Spécifie les routes sur lesquelles ce middleware doit s'appliquer.
export const config = {
  matcher: '/dashboard/:path*',
};