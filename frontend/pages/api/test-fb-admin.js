import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// --- Initialisation de Firebase Admin (Singleton) ---
// Ce bloc s'assure que l'initialisation n'a lieu qu'une seule fois.
try {
  if (!admin.apps.length) {
    console.log('[Firebase Admin Test] Initializing...');
    const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;

    if (!keyPath) {
      throw new Error('FIREBASE_ADMIN_KEY_PATH environment variable is not set.');
    }

    const resolvedKeyPath = path.resolve(process.cwd(), keyPath);

    if (!fs.existsSync(resolvedKeyPath)) {
        throw new Error(`Service account key file not found at: ${resolvedKeyPath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(resolvedKeyPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase Admin Test] Firebase Admin initialized.');
  } else {
    console.log('[Firebase Admin Test] Firebase Admin already initialized.');
  }
} catch (error) {
    console.error('[Firebase Admin Test] CRITICAL: Initialization failed:', error.message);
    // L'erreur est loguée ici. Le handler ci-dessous renverra une erreur claire.
}

// --- Handler de l'API ---
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Vérifier si l'initialisation a réussi
    if (!admin.apps.length) {
        throw new Error('Firebase Admin SDK is not initialized. Check server logs for the root cause.');
    }

    const db = admin.firestore();
    const diagnosticsCollection = db.collection('diagnostics');
    
    const docData = {
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'fb-admin-test'
    };

    const docRef = await diagnosticsCollection.add(docData);
    console.log(`[Firebase Admin Test] Successfully wrote diagnostic document with ID: ${docRef.id}`);

    return res.status(200).json({ ok: true, docId: docRef.id });

  } catch (error) {
    console.error('[Firebase Admin Test] API handler error:', error.message);
    return res.status(500).json({ ok: false, error: error.message });
  }
}