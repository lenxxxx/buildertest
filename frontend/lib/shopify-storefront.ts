/**
 * Récupère le cookie `storefront_digest` nécessaire pour accéder à une boutique 
 * protégée par un mot de passe, en utilisant le fetch natif de Node.js.
 * @param shopDomain Le domaine de la boutique (ex: mon-magasin.myshopify.com)
 * @param password Le mot de passe de la vitrine. Si non fourni, utilise process.env.STOREFRONT_PASSWORD.
 * @returns La chaîne du cookie `storefront_digest=...` ou null si non trouvé.
 */
export async function getStorefrontDigest(shopDomain: string, password?: string): Promise<string | null> {
  const effectivePassword = password ?? process.env.STOREFRONT_PASSWORD;
  if (!effectivePassword) {
    console.log('[storefront] No password provided, skipping digest retrieval.');
    return null;
  }

  const passwordPageUrl = `https://${shopDomain}/password`;

  try {
    // Étape 1: Requête initiale pour obtenir les cookies de session.
    const initialRes = await fetch(passwordPageUrl);
    const initialCookies = (initialRes.headers.getSetCookie && initialRes.headers.getSetCookie()) || [initialRes.headers.get('set-cookie') || ''];

    // Étape 2: POST du mot de passe.
    const formData = new URLSearchParams({
      form_type: 'storefront_password',
      utf8: '✓',
      password: effectivePassword,
    });

    const authRes = await fetch(passwordPageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': initialCookies.join('; '),
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    // Étape 3: Extraire le cookie `storefront_digest`.
    const cookies = (authRes.headers.getSetCookie && authRes.headers.getSetCookie()) || [authRes.headers.get('set-cookie') || ''];
    const digestCookie = cookies.find(c => c.trim().startsWith('storefront_digest='));

    const cookiePresent = !!digestCookie;
    console.log(`[storefront] storefront_digest present: ${cookiePresent}`);

    return digestCookie ? digestCookie.split(';')[0] : null;

  } catch (error) {
    console.error('[storefront] Failed to get storefront digest cookie:', error);
    return null;
  }
}
