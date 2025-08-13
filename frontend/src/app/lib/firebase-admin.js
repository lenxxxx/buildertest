
import 'server-only';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let appInstance;

function initializeAdmin() {
  const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY_PATH;
  if (!serviceAccountPath) {
    console.error('[Firebase Admin] FATAL ERROR: FIREBASE_ADMIN_KEY_PATH is not defined in .env.local');
    throw new Error('FIREBASE_ADMIN_KEY_PATH must be set.');
  }

  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
  console.log(`[Firebase Admin] Trying to read service account key from: ${resolvedPath}`);

  if (!admin.apps.length) {
    let serviceAccount;
    try {
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      serviceAccount = JSON.parse(content);
      console.log('[Firebase Admin] Service account key file read and parsed successfully.');
    } catch (err) {
      console.error(`[Firebase Admin] FATAL ERROR: Could not read or parse the service account key at ${resolvedPath}.`, err);
      throw new Error(`Failed to read/parse Firebase Admin key: ${err.message}`);
    }

    try {
      appInstance = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        projectId: serviceAccount.project_id || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
      });
      console.log(`[Firebase Admin] SDK initialized successfully for bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
    } catch (initError) {
        console.error('[Firebase Admin] FATAL ERROR: Failed to initialize Firebase Admin SDK.', initError);
        throw new Error(`Failed to initialize Firebase Admin: ${initError.message}`);
    }

  } else {
    appInstance = admin.app();
    console.log('[Firebase Admin] SDK already initialized.');
  }
  return appInstance;
}

// Exécute l'initialisation au chargement du module
initializeAdmin();

/**
 * @returns {admin.app.App}
 */
export function initFirebaseAdmin() {
  return appInstance;
}

/**
 * @returns {admin.auth.Auth}
 */
export const getAdminAuth = () => admin.auth();

/**
 * @returns {admin.firestore.Firestore}
 */
export const getAdminFirestore = () => admin.firestore();
