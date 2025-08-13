// src/app/api/admin/ping/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const db = getAdminFirestore();
    await db.doc('diagnostics/ping').set({ ts: Date.now() }, { merge: true });
    return NextResponse.json({ ok: true, wrote: true });
  } catch (e: any) {
    console.error('[api/admin/ping] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
