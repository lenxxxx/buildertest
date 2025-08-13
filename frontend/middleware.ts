import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Les chemins publics qui ne nécessitent pas d'authentification
const publicPaths = [
  '/login',
  '/register',
  '/api/test-fb-admin',
  '/api/init-base-theme-public' // Ajout de la route de debug
];

// Les chemins et ressources statiques à ignorer
const ignoredPrefixes = ['/_next/', '/favicon.ico', '/assets/'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Ignorer les ressources statiques et les chemins de Next.js
  if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Vérifier si le chemin est public
  if (publicPaths.includes(pathname)) {
    console.log(`[Middleware] Bypass auth for public path: ${pathname}`);
    return NextResponse.next();
  }

  // 3. Vérifier le flag de debug pour l'endpoint original
  if (pathname === '/api/init-base-theme' && searchParams.get('skipAuth') === 'true') {
    console.log('[Middleware] Bypass auth via skipAuth flag.');
    return NextResponse.next();
  }

  // 4. Vérifier la présence du cookie "token" pour toutes les autres routes
  const token = request.cookies.get('token');

  if (!token) {
    // 5. Si pas de token, rediriger vers la page de login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Garde en mémoire la page d'origine
    return NextResponse.redirect(loginUrl);
  }

  // 6. Si le token est présent, autoriser l'accès
  return NextResponse.next();
}

// Configuration du matcher pour spécifier où le middleware doit s'exécuter
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (pour les routes d'auth next-auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*) ',
  ],
};