import { stopSessionContainer } from '@/lib/docker';

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
    await stopSessionContainer(shop);
    return res.status(200).json({ success: true, shop });
  } catch (error) {
    console.error(`[API /session/stop] Failed for ${shop}:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}