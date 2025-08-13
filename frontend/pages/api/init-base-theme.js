
import admin from 'firebase-admin';
import { mkdir, rm, unlink } from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import fs from 'fs';

// Le helper a déjà initialisé Firebase Admin, on récupère juste le bucket.
// Assurez-vous que votre helper firebase-admin.js est bien importé quelque part au démarrage
// ou appelez une fonction d'initialisation ici si nécessaire.
import '@/app/lib/firebase-admin.js';

const bucket = admin.storage().bucket();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { shop } = req.query;
  if (!shop || !/^[a-zA-Z0-9.-]+.myshopify.com$/.test(shop)) {
    return res.status(400).json({ success: false, error: 'A valid shop parameter is required.' });
  }

  // Le dossier de travail sera à la racine du projet Next.js
  const workspaceDir = path.resolve(process.cwd(), 'workspaces', shop, 'theme');
  const tempZipPath = path.join(workspaceDir, 'theme.zip');
  const sourceZipInBucket = 'themes/base/theme.zip';

  console.log(`[Init Theme] Request for shop: ${shop}`);
  console.log(`[Init Theme] Target workspace directory: ${workspaceDir}`);

  try {
    // 1. Nettoyer le dossier de travail s'il existe et le recréer
    console.log(`[Init Theme] Cleaning and creating directory: ${workspaceDir}`);
    await rm(workspaceDir, { recursive: true, force: true });
    await mkdir(workspaceDir, { recursive: true });

    // 2. Télécharger le fichier ZIP depuis Firebase Storage
    console.log(`[Init Theme] Starting download of ${sourceZipInBucket} from Storage...`);
    await bucket.file(sourceZipInBucket).download({ destination: tempZipPath });
    console.log(`[Init Theme] Download finished.`);

    // 3. Dézipper le fichier
    console.log(`[Init Theme] Starting unzip of ${tempZipPath}...`);
    const stream = fs.createReadStream(tempZipPath)
      .pipe(unzipper.Extract({ path: workspaceDir }));
    
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
    console.log('[Init Theme] Unzip finished.');

    // 4. Supprimer le fichier ZIP temporaire
    await unlink(tempZipPath);
    console.log(`[Init Theme] Deleted temporary zip file.`);

    return res.status(200).json({ 
      success: true, 
      message: `Theme workspace initialized for ${shop}`,
      path: workspaceDir,
      shop: shop
    });

  } catch (error) {
    console.error(`[Init Theme] An error occurred for shop ${shop}:`, error);
    // Nettoyage en cas d'erreur pour ne pas laisser un état corrompu
    await rm(workspaceDir, { recursive: true, force: true }).catch(e => console.error('Failed to cleanup workspace on error:', e));
    return res.status(500).json({ 
      success: false, 
      error: error.message, 
      code: error.code 
    });
  }
}
