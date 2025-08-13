import { NextResponse } from 'next/server';
import { runSSHScript } from '@/lib/ssh';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  // 1. Vérification de l'environnement
  if (process.env.NODE_ENV === 'production') {
    return new Response('Forbidden: This endpoint is not available in production.', { status: 403 });
  }

  // 2. Vérification de la clé de sécurité
  const devKey = req.headers.get('X-Dev-Key');
  if (devKey !== process.env.DEV_KEY) {
    return new Response('Unauthorized: Missing or invalid X-Dev-Key header.', { status: 401 });
  }

  try {
    // 3. Exécution de la commande pour lire le Caddyfile
    const caddyfileContent = await runSSHScript('cat /tmp/Caddyfile');
    
    // 4. Réponse avec le contenu
    return new Response(caddyfileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error(`[dev/caddyfile] failed to read /tmp/Caddyfile:`, error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}