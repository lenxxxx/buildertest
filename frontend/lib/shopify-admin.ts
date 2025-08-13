import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-07';

// --- API Client Wrapper ---
export async function shopifyFetch(shopDomain: string, accessToken: string, path: string, options: RequestInit = {}) {
  const url = `https://${shopDomain}/admin/api/${API_VERSION}/${path}`;
  const method = options.method || 'GET';
  
  // --- LOG DE DIAGNOSTIC ---
  const headers = options.headers as Record<string, string> || {};
  const tokenLen = headers['X-Shopify-Access-Token']?.length || accessToken?.length || 0;
  console.log('[auth-diag] call', method, path, 'token.len=', tokenLen);
  // --- FIN LOG ---

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
      ...headers,
    },
  });
  
  console.log('[shopify]', method, path, '→', response.status);

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`Shopify API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === 204) return {};
  return response.json();
}

// --- Scopes Helper ---
export async function requireThemeScopes(shopDomain: string, accessToken: string) {
  const shopDoc = await db.collection('shops').doc(shopDomain).get();
  let scopes = shopDoc.data()?.scopes || '';

  if (!scopes) {
    try {
      const { access_scopes } = await shopifyFetch(shopDomain, accessToken, 'oauth/access_scopes.json');
      scopes = access_scopes.map((s: any) => s.handle).join(',');
    } catch (e: any) {
      if (e.status === 401) return { ok: false, reason: 'reauthorize' };
      throw e;
    }
  }

  if (!scopes.includes('read_themes') || !scopes.includes('write_themes')) {
    return { ok: false, reason: 'reauthorize' };
  }
  return { ok: true };
}

// ... (createThemeDraft, waitThemeReady, etc. restent inchangés)
async function getTheme(shopDomain: string, accessToken: string, themeId: number) {
  try {
    const { theme } = await shopifyFetch(shopDomain, accessToken, `themes/${themeId}.json`);
    return theme;
  } catch (error: any) {
    if (error.status === 404) return null;
    if (error.status === 401) throw new Error('reauthorize');
    throw error;
  }
}

async function createThemeDraft(shopDomain: string, accessToken: string): Promise<number> {
  console.log('[theme] creating draft theme...');
  const { theme } = await shopifyFetch(shopDomain, accessToken, 'themes.json', {
    method: 'POST',
    body: JSON.stringify({
      theme: { name: "Hyperush Preview", role: "unpublished" },
    }),
  });
  return theme.id;
}

async function waitThemeReady(shopDomain: string, accessToken: string, themeId: number): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const theme = await getTheme(shopDomain, accessToken, themeId);
    if (theme && !theme.processing) {
      console.log(`[theme] theme ${themeId} is ready.`);
      return;
    }
    await new Promise(res => setTimeout(res, 1000));
  }
  throw new Error(`Theme ${themeId} was still processing after 60s.`);
}


/**
 * Fonction ensurePreviewTheme idempotente et safe en concurrence.
 */
export async function ensurePreviewTheme({ shopDomain, accessToken }: { shopDomain: string; accessToken: string; }): Promise<number> {
  if (!accessToken) throw new Error('reauthorize');

  const shopDocRef = db.collection('shops').doc(shopDomain);

  for (let i = 0; i < 60; i++) {
    const shopDoc = await shopDocRef.get();
    const shopData = shopDoc.data();

    if (shopData?.themeId && shopData?.status === 'ready') {
      const theme = await getTheme(shopDomain, accessToken, shopData.themeId);
      if (theme) {
        console.log(`[theme] use existing ${shopData.themeId}`);
        return shopData.themeId;
      }
      console.log(`[theme] theme ${shopData.themeId} not found on Shopify, will recreate.`);
    }

    if (shopData?.status === 'creating' && Timestamp.now().seconds - (shopData.updatedAt?.seconds || 0) < 60) {
      console.log('[theme] another process is creating, waiting...');
      await new Promise(res => setTimeout(res, 1000));
      continue;
    }

    console.log('[theme] acquiring lock and creating theme...');
    await shopDocRef.set({ status: "creating", updatedAt: Timestamp.now() }, { merge: true });

    const themeId = await createThemeDraft(shopDomain, accessToken);
    await waitThemeReady(shopDomain, accessToken, themeId);

    await shopDocRef.update({ themeId, status: "ready", updatedAt: Timestamp.now() });
    console.log(`[theme] ready ${themeId}`);
    return themeId;
  }

  throw new Error('Failed to ensure preview theme after 60 attempts.');
}
