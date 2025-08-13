import { getAuth } from 'firebase/auth';

// ... (fonctions getIdTokenOrThrow, postEnsurePreview restent identiques)
async function getIdTokenOrThrow(): Promise<string> {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('User not authenticated.');
  return await auth.currentUser.getIdToken(false);
}

async function postEnsurePreview(
  shopDomain: string,
  idToken: string
): Promise<{ 
  themeId?: number; 
  openUrl?: string | null;
  needsAuth?: boolean;
  authUrl?: string;
}> {
  const response = await fetch('/api/shops/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ shopDomain }),
  });

  if (response.status === 401) {
    const data = await response.json();
    if (data.error === 'reauthorize' && data.authUrl) {
      return { needsAuth: true, authUrl: data.authUrl };
    }
  }

  if (!response.ok) throw new Error(`Failed to ensure preview: ${response.statusText}`);
  return await response.json();
}

async function getNgrokUrl(): Promise<string | null> {
  try {
    const response = await fetch('/api/ngrok', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.url ?? null;
  } catch (error) {
    console.error('Error fetching /api/ngrok:', error);
    return null;
  }
}

const previewsInProgress = new Set();

export async function ensurePreviewForShop(
  shop: { shop: string; },
  { onStatus }: { onStatus?: (s: string) => void } = {}
): Promise<{ 
  previewUrl: string | null; 
  openUrl?: string | null;
  needsAuth?: boolean;
  authUrl?: string;
}> {
  if (previewsInProgress.has(shop.shop)) {
    return { previewUrl: null };
  }

  try {
    previewsInProgress.add(shop.shop);
    onStatus?.('ensure-server');
    const idToken = await getIdTokenOrThrow();
    // D'abord, on s'assure que le thème existe et on récupère l'URL d'ouverture
    const res = await postEnsurePreview(shop.shop, idToken);
    
    if (res.needsAuth) {
      onStatus?.('reauthorize');
      return { needsAuth: true, authUrl: res.authUrl, previewUrl: null, openUrl: null };
    }
    
    const { openUrl } = res;
    
    onStatus?.('check-ngrok');
    // Ensuite, on récupère l'URL du proxy ngrok pour l'iframe
    let ngrokUrl = await getNgrokUrl();

    if (!ngrokUrl) {
      onStatus?.('error');
      console.warn('Ngrok URL is not available.');
      // On garde l'iframe vide et on affiche un message d'erreur
      return { previewUrl: null, openUrl };
    }

    // Construction sûre de l’URL avec skip + timestamp
    try {
      const u = new URL(ngrokUrl);
      u.searchParams.set('ngrok-skip-browser-warning', 'true');
      u.searchParams.set('_ts', Date.now().toString());
      ngrokUrl = u.toString();
    } catch {
      // fallback ancien comportement si jamais
      ngrokUrl = ngrokUrl.includes('?')
        ? `${ngrokUrl}&ngrok-skip-browser-warning=true&_ts=${Date.now()}`
        : `${ngrokUrl}/?ngrok-skip-browser-warning=true&_ts=${Date.now()}`;
    }

    onStatus?.('ready');
    console.log('[preview-client] done');
    // L'URL de l'iframe est l'URL ngrok avec le paramètre skip.
    return { previewUrl: ngrokUrl, openUrl };

  } catch (error) {
    console.error('ensurePreviewForShop failed:', error);
    onStatus?.('error');
    return { previewUrl: null, openUrl: null };
  } finally {
    previewsInProgress.delete(shop.shop);
  }
}
