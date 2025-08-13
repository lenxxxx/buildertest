
import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { shopifyFetch } from '@/lib/shopify-admin'; // Assuming shopifyFetch is exported for this

export const runtime = 'nodejs';

async function getTheme(shopDomain: string, accessToken: string, themeId: number) {
    const { theme } = await shopifyFetch(shopDomain, accessToken, `themes/${themeId}.json`);
    return theme;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const shopDomain = searchParams.get('shop');
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token || !shopDomain) {
        return NextResponse.json({ ok: false, error: 'Unauthorized or missing shop parameter' }, { status: 401 });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const shopDoc = await db.collection('shops').doc(shopDomain).get();
        if (!shopDoc.exists || shopDoc.data()?.ownerId !== uid) {
            return NextResponse.json({ ok: false, error: 'Shop not found or access denied' }, { status: 403 });
        }

        const { themeId, accessToken } = shopDoc.data()!;
        if (!themeId) {
            return NextResponse.json({ ok: false, processing: true, error: 'Theme not created yet' });
        }

        const theme = await getTheme(shopDomain, accessToken, themeId);
        return NextResponse.json({ ok: true, processing: theme.processing });

    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
