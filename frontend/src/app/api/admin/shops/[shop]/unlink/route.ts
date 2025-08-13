import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ shop: string }>}) {
  try {
    const { shop: rawShop } = await ctx.params;
    if (!rawShop) {
      return NextResponse.json({ ok: false, error: 'shop-missing' }, { status: 400 });
    }

    const raw = decodeURIComponent(rawShop).trim();
    const shop = raw.endsWith('.myshopify.com') ? raw : `${raw}.myshopify.com`;

    const db = getAdminFirestore();

    // Idempotent deletion of the main shop document and its secrets
    await db.doc(`shops/${shop}`).delete().catch(() => {});
    await db.doc(`shopSecrets/${shop}`).delete().catch(() => {});

    return NextResponse.json({ ok: true, shop });

  } catch (e: any) {
    console.error('[admin/shops/unlink] error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const DELETE = POST;