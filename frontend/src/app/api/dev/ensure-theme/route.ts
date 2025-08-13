import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { ensurePreviewTheme } from '@/lib/shopify-admin';

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

  // 3. Lecture du paramètre 'shop'
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ ok: false, error: 'Missing shop query parameter' }, { status: 400 });
  }

  console.log(`[dev/ensure-theme] start for shop: ${shop}`);

  try {
    // 4. Récupération de l'accessToken depuis Firestore
    const shopDoc = await db.collection('shops').doc(shop).get();
    if (!shopDoc.exists) {
      return NextResponse.json({ ok: false, error: 'Shop not found in Firestore' }, { status: 404 });
    }
    const accessToken = shopDoc.data()?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Access token not found for shop' }, { status: 404 });
    }

    // 5. Appel de la fonction principale
    const themeId = await ensurePreviewTheme({ shopDomain: shop, accessToken });

    console.log(`[dev/ensure-theme] done { themeId: ${themeId} }`);
    
    // 6. Réponse
    return NextResponse.json({ ok: true, themeId });

  } catch (error: any) {
    console.error(`[dev/ensure-theme] failed for ${shop}:`, error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
