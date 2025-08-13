import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/app/lib/firebase-admin';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('shops').limit(100).get();
    const items = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        shopDomain: data.shopDomain ?? d.id,
        hasToken: !!data.accessToken,
        scopes: data.scopes ?? null,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
    });
    return NextResponse.json({ count: items.length, items });
  } catch (e: any) {
    console.error('[admin/shops] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
