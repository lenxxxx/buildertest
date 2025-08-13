
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebase-admin'; // Assurez-vous que le chemin est correct
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('[Admin Health] Received health check request.');

  try {
    // 1. Initialiser Firebase Admin
    getFirebaseAdmin();
    const db = getFirestore();
    console.log('[Admin Health] Firebase Admin SDK is ready.');

    // 2. Écrire un document de test
    const healthCheckRef = db.collection('health_checks').doc('latest');
    const writeData = { timestamp: new Date().toISOString(), status: 'writing' };
    console.log('[Admin Health] Writing test document to Firestore...');
    await healthCheckRef.set(writeData);
    console.log('[Admin Health] Write successful.');

    // 3. Lire le document pour confirmer
    console.log('[Admin Health] Reading test document from Firestore...');
    const doc = await healthCheckRef.get();

    if (!doc.exists || doc.data()?.timestamp !== writeData.timestamp) {
      throw new Error('Read/write check failed. Data mismatch.');
    }
    console.log('[Admin Health] Read successful and data validated.');

    // 4. Nettoyer le document de test (optionnel mais propre)
    // await healthCheckRef.delete();

    // 5. Envoyer la réponse de succès
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('[Admin Health] Health check failed:', error.message);
    return res.status(500).json({ 
      status: 'error', 
      error: error.message, 
      details: error.stack 
    });
  }
}
