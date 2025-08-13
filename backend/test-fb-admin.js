// backend/test-fb-admin.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charge explicitement le .env.local à la racine du projet
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

console.log('=== variables chargées ===');
console.log('FIREBASE_ADMIN_KEY_PATH =', process.env.FIREBASE_ADMIN_KEY_PATH);
console.log('FIREBASE_STORAGE_BUCKET =', process.env.FIREBASE_STORAGE_BUCKET);

// validations
if (!process.env.FIREBASE_ADMIN_KEY_PATH) {
  console.error('❌ Il manque FIREBASE_ADMIN_KEY_PATH dans .env.local');
  process.exit(1);
}
if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error('❌ Il manque FIREBASE_STORAGE_BUCKET dans .env.local');
  process.exit(1);
}

// Résolution du chemin de la clé de service (depuis la racine)
const keyPath = path.resolve(__dirname, '..', process.env.FIREBASE_ADMIN_KEY_PATH);
if (!fs.existsSync(keyPath)) {
  console.error('❌ Le fichier de clé de service n’existe pas à', keyPath);
  process.exit(1);
}

try {
  try {
    getApp();
    console.log('ℹ️ Firebase app déjà initialisée, réutilisation.');
  } catch {
    const serviceAccountRaw = fs.readFileSync(keyPath, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountRaw);
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase admin initialisé avec la clé de service.');
  }

  const storage = getStorage();
  const bucket = storage.bucket(); // utilise le bucket par défaut

  console.log(`🟢 tentative de listing de themes/base/ dans bucket ${process.env.FIREBASE_STORAGE_BUCKET}`);
  const [files] = await bucket.getFiles({ prefix: 'themes/base/' });
  if (files.length === 0) {
    console.warn('⚠️ Aucun fichier trouvé sous themes/base/ (vérifie que theme.zip est bien uploadé).');
  } else {
    console.log('📦 Fichiers trouvés sous themes/base/:', files.map(f => f.name));
  }
} catch (e) {
  console.error('❌ ERREUR GLOBALE:', e);
}