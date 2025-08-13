import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { db, auth } from '@/lib/firebase-admin';
import { requireThemeScopes } from '@/lib/shopify-admin';
import { ensurePreviewContainer } from '@/lib/ssh';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const FALLBACK_HOST = process.env.PREVIEW_FALLBACK_HOST ?? '8ydjrw-93.myshopify.com';
if (!process.env.PREVIEW_FALLBACK_HOST) {
  console.warn('[create] PREVIEW_FALLBACK_HOST is missing, using default 8ydjrw-93.myshopify.com');
}

async function mainFlow(shopDomain: string, uid: string, idemKey: string) {
    const shopDocRef = db.collection('shops').doc(shopDomain);
    const idemDocRef = shopDocRef.collection('idem').doc('creates').collection('keys').doc(idemKey);

    // 1. Check for existing completed request
    const idemDoc = await idemDocRef.get();
    if (idemDoc.exists && idemDoc.data()?.status === 'done') {
        const { themeId } = idemDoc.data()!;
        const openUrl = `https://${shopDomain}?preview_theme_id=${themeId}`;
        console.log(`[create] idemKey=${idemKey}, reused=true, themeId=${themeId}`);
        return { ok: true, themeId, openUrl };
    }

    // 2. Lock the operation
    try {
        await idemDocRef.create({
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error: any) {
        if (error.code === 6) { // ALREADY_EXISTS
            throw new Error('Idempotency key conflict: operation already in progress.');
        }
        throw error;
    }
    
    try {
        // 3. Main logic
        const shopDoc = await shopDocRef.get();
        if (!shopDoc.exists || shopDoc.data()?.ownerId !== uid) {
            throw new Error('Shop not found or access denied');
        }
        const shopData = shopDoc.data()!;
        const { accessToken } = shopData;

        const scopesCheck = await requireThemeScopes(shopDomain, accessToken);
        if (!scopesCheck.ok) {
            throw new Error('reauthorize');
        }

        // --- New Theme Creation Logic ---
        const object = process.env.THEME_BASE_OBJECT || 'themes/base-theme.zip';
        const [signedUrl] = await admin.storage().bucket().file(object).getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * (Number(process.env.THEME_BASE_URL_TTL_MIN) || 60),
        });

        const createResponse = await fetch(`https://${shopDomain}/admin/api/2024-04/themes.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                theme: {
                    name: `preview-${Date.now()}`,
                    role: 'unpublished',
                    src: signedUrl,
                },
            }),
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Shopify theme creation failed: ${errorText}`);
        }

        const { theme } = await createResponse.json();
        const themeId = theme.id;

        // Poll for theme processing completion
        let isProcessing = true;
        for (let i = 0; i < 30; i++) {
            const pollResponse = await fetch(`https://${shopDomain}/admin/api/2024-04/themes/${themeId}.json`, {
                headers: { 'X-Shopify-Access-Token': accessToken },
            });
            const { theme: polledTheme } = await pollResponse.json();
            if (!polledTheme.processing) {
                isProcessing = false;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (isProcessing) {
            throw new Error(`Theme ${themeId} is still processing after 30 seconds.`);
        }
        // --- End of New Logic ---

        try {
            await ensurePreviewContainer(FALLBACK_HOST);
        } catch (e: any) {
            console.warn(`[create] ensurePreviewContainer failed but we continue:`, e.message);
        }

        // 4. Success: update lock, Firestore, and return
        await db.doc(`shops/${shopDomain}/themes/${themeId}`).set({
            role: 'unpublished',
            source: 'base-zip',
            status: 'ready',
            createdAt: FieldValue.serverTimestamp(),
        });

        await idemDocRef.update({
            status: 'done',
            themeId,
            finishedAt: FieldValue.serverTimestamp(),
        });

        const openUrl = `https://${shopDomain}?preview_theme_id=${themeId}`;
        console.log(`[create] idemKey=${idemKey}, reused=false, themeId=${themeId}`);
        return { ok: true, themeId, openUrl };

    } catch (error: any) {
        // 5. Failure: update lock and re-throw
        await idemDocRef.update({
            status: 'error',
            error: error.message,
            finishedAt: FieldValue.serverTimestamp(),
        });
        throw error;
    }
}

export async function POST(req: Request) {
    let idemKey = req.headers.get('X-Idem-Key');
    if (!idemKey) {
        idemKey = randomUUID();
        console.warn(`[create] Missing X-Idem-Key, generated a new one: ${idemKey}`);
    }

    const { shopDomain } = await req.json();
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const result = await mainFlow(shopDomain, uid, idemKey);
        return NextResponse.json(result);

    } catch (error: any) {
        if (error.message === 'reauthorize') {
            return NextResponse.json(
                { error: 'reauthorize', authUrl: `/api/auth/start?shop=${shopDomain}` },
                { status: 401 }
            );
        }
        if (error.message === 'Shop not found or access denied') {
            return NextResponse.json({ error: 'shop-not-found' }, { status: 404 });
        }
        console.error(`[API /shops/create] idemKey=${idemKey}, A fatal error occurred for ${shopDomain}:`, error);
        
        return NextResponse.json(
            { ok: false, error: error.message, code: (error as any).status },
            { status: 500 }
        );
    }
}

