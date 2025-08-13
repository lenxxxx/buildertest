import { NextResponse } from 'next/server';
import crypto from 'crypto';

const { SHOPIFY_API_KEY, SCOPES, HOST } = process.env;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return new Response('Missing shop parameter', { status: 400 });
  }

  const state = crypto.randomBytes(32).toString('hex');
  const redirectUri = `${HOST}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SCOPES || 'read_themes,write_themes',
    redirect_uri: redirectUri,
    state: state,
    'grant_options[]': 'per-user',
  });

  const authUrl = `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  
  const response = NextResponse.redirect(authUrl);
  
  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });

  console.log(`[oauth] start → set state ${state}`);

  return response;
}
