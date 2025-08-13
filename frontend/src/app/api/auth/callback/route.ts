import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, HOST } = process.env;

function validateHmac(query: URLSearchParams) {
  const hmac = query.get('hmac');
  query.delete('hmac');
  query.sort();
  const queryString = query.toString();
  const generatedHmac = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(queryString).digest('hex');
  return generatedHmac === hmac;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const shop = searchParams.get('shop');
  
  // Use async cookies() store
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('shopify_oauth_state')?.value;
  const uid = cookieStore.get('link_uid')?.value;

  console.log(`[oauth] callback → received`, { stateParam, stateCookie, uid_present: !!uid });

  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return new Response('State mismatch. CSRF attack suspected.', { status: 403 });
  }

  if (!shop || !code) {
    return new Response('Missing shop or code parameter', { status: 400 });
  }

  if (!validateHmac(searchParams)) {
    return new Response('HMAC validation failed', { status: 400 });
  }

  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code }),
    });

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    if (!access_token) {
      throw new Error('Failed to get access token.');
    }

    const scopesResponse = await fetch(`https://${shop}/admin/oauth/access_scopes.json`, {
        headers: { 'X-Shopify-Access-Token': access_token },
    });
    const { access_scopes } = await scopesResponse.json();
    const scopes = access_scopes.map((s: any) => s.handle).join(',');

    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2024-07/shop.json`, {
      headers: { 'X-Shopify-Access-Token': access_token },
    });
    const { shop: shopInfo } = await shopInfoResponse.json();

    const db = getAdminFirestore();
    const batch = db.batch();
    const shopDocRef = db.collection('shops').doc(shop);
    
    const shopData: any = {
      shop,
      name: shopInfo.name,
      accessToken: access_token,
      scopes,
      updatedAt: Timestamp.now(),
    };

    // If we have the UID from the cookie, link the shop to the user.
    if (uid) {
        shopData.ownerId = uid;
        const userShopLinkRef = db.collection('users').doc(uid).collection('shops').doc(shop);
        batch.set(userShopLinkRef, { shop, name: shopInfo.name, linkedAt: Timestamp.now() }, { merge: true });
    }

    batch.set(shopDocRef, shopData, { merge: true });
    await batch.commit();

    const redirectUrl = new URL('/dashboard', HOST);
    redirectUrl.searchParams.set('shop', shop);
    redirectUrl.searchParams.set('linked', 'true');

    const response = NextResponse.redirect(redirectUrl);
    // Clean up both state and uid cookies
    response.cookies.set('shopify_oauth_state', '', { maxAge: 0, path: '/' });
    response.cookies.set('link_uid', '', { maxAge: 0, path: '/' });

    return response;

  } catch (error: any) {
    console.error('[Auth Callback] Critical error:', error);
    return new Response('An error occurred during the OAuth callback.', { status: 500 });
  }
}
