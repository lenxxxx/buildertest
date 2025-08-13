
import { NextResponse } from 'next/server';
import { db, bucket } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. Firestore check
    const docRef = db.collection('_healthz').doc('ping');
    await docRef.set({ timestamp: Timestamp.now() });

    // 2. Storage check
    const [files] = await bucket.getFiles({ prefix: 'themes/base-theme.zip' });
    const storageHasBaseTheme = files.length > 0;

    return NextResponse.json({ ok: true, storageHasBaseTheme });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
