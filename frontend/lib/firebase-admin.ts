import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let adminInstance: admin.app.App | null = null;

function getServiceAccount() {
  if (process.env.FIREBASE_ADMIN_KEY_PATH) {
    const keyPath = path.resolve(process.cwd(), process.env.FIREBASE_ADMIN_KEY_PATH);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Firebase Admin key file not found at path: ${keyPath}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Service Account JSON is invalid. Must contain project_id, client_email, and private_key.');
    }
    return serviceAccount;
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(
    'Firebase Admin credentials not found. Please set either FIREBASE_ADMIN_KEY_PATH or the group of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
  );
}

const initializeFirebaseAdmin = (): admin.app.App => {
  if (!process.env.FIREBASE_STORAGE_BUCKET) {
    throw new Error('Required environment variable FIREBASE_STORAGE_BUCKET is not set.');
  }

  try {
    const serviceAccount = getServiceAccount();
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('[Firebase Admin] Initialized successfully.');
    return app;
  } catch (error) {
    console.error('[Firebase Admin] CRITICAL: Initialization failed:', error.message);
    throw error;
  }
};

export const getFirebaseAdmin = (): admin.app.App => {
    if (admin.apps.length) {
        return admin.apps[0]!;
    }
    return initializeFirebaseAdmin();
};

const adminApp = getFirebaseAdmin();

export const db = adminApp.firestore();
export const storage = adminApp.storage();
export const bucket = storage.bucket();
export const auth = adminApp.auth();

// Wrapper function to get the Firestore instance, consistent with other services.
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminFirestore() {
  const app = getFirebaseAdmin();
  return getFirestore(app);
}
