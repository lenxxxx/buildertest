// src/app/api/admin/check/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/app/lib/firebase-admin';
import admin from 'firebase-admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    initFirebaseAdmin();
    return NextResponse.json({ projectId: admin.app().options.projectId });
  } catch (e: any) {
    console.error('[api/admin/check] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
