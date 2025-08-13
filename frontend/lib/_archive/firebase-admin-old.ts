
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Variable pour stocker l'instance singleton
let adminInstance: admin.app.App | null = null;

const initializeFirebaseAdmin = (): admin.app.App => {
  console.log('[Firebase Admin] Initializing...');

  // 1. Déterminer le chemin de la clé de service
  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!keyPath) {
    console.error('[Firebase Admin] Error: FIREBASE_ADMIN_KEY_PATH or GOOGLE_APPLICATION_CREDENTIALS must be set.');
    throw new Error('Firebase Admin key path not configured.');
  }

  // 2. Résoudre le chemin en absolu
  // process.cwd() est la racine du projet Next.js (ici, /frontend)
  const absoluteKeyPath = path.resolve(process.cwd(), keyPath);
  console.log(`[Firebase Admin] Resolved key path: ${absoluteKeyPath}`);

  // 3. Vérifier l'existence du fichier
  if (!fs.existsSync(absoluteKeyPath)) {
    console.error(`[Firebase Admin] Error: Service account key file not found at ${absoluteKeyPath}`);
    throw new Error('Service account key file not found.');
  }

  try {
    // 4. Lire et parser la clé de service
    const serviceAccount = JSON.parse(fs.readFileSync(absoluteKeyPath, 'utf8'));

    // 5. Initialiser l'application
    adminInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('[Firebase Admin] Successfully initialized.');
    return adminInstance;

  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
};

/**
 * Obtient l'instance de Firebase Admin (singleton).
 * Initialise le SDK lors du premier appel.
 * @returns {admin.app.App} L'instance de l'application Firebase Admin.
 */
export const getFirebaseAdmin = (): admin.app.App => {
  if (adminInstance) {
    return adminInstance;
  }
  // Si l'instance n'existe pas, on vérifie si une app existe déjà (Next.js peut recharger les modules)
  if (admin.apps.length > 0) {
    adminInstance = admin.apps[0];
    return adminInstance!;
  }
  // Sinon, on initialise
  return initializeFirebaseAdmin();
};
