
import { initBaseTheme } from '@/lib/theme';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { shop } = req.query;
  console.log(`[API Public] Received request for shop: ${shop}`);

  try {
    const workspacePath = await initBaseTheme(shop);
    return res.status(200).json({ 
      success: true, 
      path: workspacePath,
      shop: shop
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
}
