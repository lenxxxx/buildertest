
import { initFirebaseAdmin } from '@/app/lib/firebase-admin';
import admin from 'firebase-admin';
import { mkdir, rm, unlink } from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import fs from 'fs';

// L'initialisation se fait dans le helper, on a juste besoin de récupérer le bucket
const bucket = admin.storage().bucket();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { shop } = req.query;
  if (!shop || !/^[a-zA-Z0-9.-]+.myshopify.com$/.test(shop)) {
    return res.status(400).json({ error: 'A valid shop parameter is required.' });
  }

  const targetDir = path.join('/tmp', 'themes', shop);
  const zipPath = path.join(targetDir, 'theme.zip');
  const sourceZipPath = 'themes/base/theme.zip';

  console.log(`[Prepare Theme] Request for shop: ${shop}`);
  console.log(`[Prepare Theme] Target directory: ${targetDir}`);

  try {
    // 1. Nettoyer le dossier cible s'il existe et le recréer
    console.log(`[Prepare Theme] Cleaning up and creating directory: ${targetDir}`);
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });

    // 2. Télécharger le fichier ZIP depuis Firebase Storage
    console.log(`[Prepare Theme] Downloading ${sourceZipPath} from Storage to ${zipPath}...`);
    await bucket.file(sourceZipPath).download({ destination: zipPath });
    console.log('[Prepare Theme] Download complete.');

    // 3. Dézipper le fichier
    console.log(`[Prepare Theme] Unzipping ${zipPath} to ${targetDir}...`);
    const stream = fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: targetDir }));
    
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
    console.log('[Prepare Theme] Unzip complete.');

    // 4. Supprimer le fichier ZIP après décompression
    console.log(`[Prepare Theme] Deleting temporary zip file: ${zipPath}`);
    await unlink(zipPath);
    console.log('[Prepare Theme] Cleanup complete.');

    return res.status(200).json({ 
      success: true, 
      message: `Theme prepared for ${shop}`,
      extractedTo: targetDir 
    });

  } catch (error) {
    console.error(`[Prepare Theme] An error occurred for shop ${shop}:`, error);
    // Essayer de nettoyer en cas d'erreur
    await rm(targetDir, { recursive: true, force: true }).catch(e => console.error('Failed to cleanup on error:', e));
    return res.status(500).json({ 
      success: false, 
      error: error.message, 
      code: error.code 
    });
  }
}
