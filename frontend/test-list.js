// frontend/test-list.js
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

dotenv.config({ path: '.env.local' });

console.log('=== variables chargées ===');
console.log('FIREBASE_ADMIN_KEY_PATH =', process.env.FIREBASE_ADMIN_KEY_PATH);
console.log('FIREBASE_STORAGE_BUCKET =', process.env.FIREBASE_STORAGE_BUCKET);

if (!process.env.FIREBASE_ADMIN_KEY_PATH) {
  console.error('❌ Il manque FIREBASE_ADMIN_KEY_PATH dans .env.local');
  process.exit(1);
}
if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error('❌ Il manque FIREBASE_STORAGE_BUCKET dans .env.local');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, process.env.FIREBASE_ADMIN_KEY_PATH);

let serviceAccount;
try {
  const raw = await readFile(keyPath, 'utf-8');
  serviceAccount = JSON.parse(raw);
} catch (e) {
  console.error('❌ Impossible de lire la clé Firebase Admin à', keyPath, e);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  // force explicit bucket name pour éviter ambiguïté
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const storage = getStorage();

// debug : lister les buckets accessibles par ce compte
async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('✅ Buckets accessibles :', buckets.map(b => b.name));
  } catch (e) {
    console.error('❌ Erreur en listant les buckets disponibles:', e);
  }
}

async function listThemePrefix() {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    console.log(`🟢 tentative de listing de themes/base/ dans bucket ${process.env.FIREBASE_STORAGE_BUCKET}`);
    const [files] = await bucket.getFiles({ prefix: 'themes/base/' });
    console.log('📦 Fichiers trouvés sous themes/base/:', files.map(f => f.name));
  } catch (e) {
    console.error('LIST ERROR:', e);
  }
}

await listBuckets();
await listThemePrefix();