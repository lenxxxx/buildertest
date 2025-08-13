import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/app/lib/firebase-admin';
export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ shop: string }>}) {
  try {
    const { shop: rawShop } = await ctx.params;
    const raw = decodeURIComponent(rawShop || '').trim();
    const shop = raw.endsWith('.myshopify.com') ? raw : `${raw}.myshopify.com`;
    const db = getAdminFirestore();

    // 1) on tente doc id = shop
    let doc = await db.collection('shops').doc(shop).get();
    if (!doc.exists) {
      // 2) fallback: rechercher par champ "shopDomain"
      const q = await db.collection('shops').where('shopDomain', '==', shop).limit(1).get();
      if (!q.empty) doc = q.docs[0];
    }
    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: 'shop-not-found', shop }, { status: 404 });
    }
    const data = doc.data() as any;
    const token = data?.accessToken;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'no-token' }, { status: 400 });
    }

    const url = `https://${shop}/admin/api/2024-07/themes.json`;
    const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token, 'Accept': 'application/json' } });
    const text = await r.text();
    let count: number | null = null;
    try { count = (JSON.parse(text).themes || []).length; } catch {}

    return NextResponse.json({ ok: r.ok, status: r.status, count, shop });
  } catch (e: any) {
    console.error('[admin/shops/verify] error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
