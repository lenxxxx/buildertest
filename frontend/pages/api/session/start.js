import { initBaseTheme } from '@/lib/theme';
import { startSessionContainer } from '@/lib/docker';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ success: false, error: 'Shop parameter is required.' });
  }

  try {
    const workspacePath = await initBaseTheme(shop);
    await startSessionContainer(shop, workspacePath);

    // 3. Construire l'URL de retour de manière robuste
    let url;
    let host = (process.env.HOST || req.headers.host).replace(/\/$/, '');

    if (/^https?:\/\//.test(host)) {
      // Si le protocole est déjà présent, on ajoute juste le port et le chemin
      const hostUrl = new URL(host);
      url = `${hostUrl.protocol}//${hostUrl.hostname}:9292/dashboard`;
    } else {
      // Sinon, on applique l'ancien comportement
      const protocol = host.startsWith('localhost') ? 'http://' : 'https://';
      url = `${protocol}${host.split(':')[0]}:9292/dashboard`;
    }

    return res.status(200).json({ success: true, url, shop });
  } catch (error) {
    console.error(`[API /session/start] Failed for ${shop}:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}