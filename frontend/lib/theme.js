
import admin from 'firebase-admin';
import { mkdir, rm, unlink } from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import fs from 'fs';

// Assurez-vous que le helper admin est chargé
import '@/lib/firebase-admin.js';

const bucket = admin.storage().bucket();

/**
 * Initializes a theme workspace for a given shop by downloading and unzipping
 * the base theme from Firebase Storage.
 * @param {string} shop - The shop identifier (e.g., 'my-shop.myshopify.com').
 * @returns {Promise<string>} The absolute path to the created workspace directory.
 */
export async function initBaseTheme(shop) {
  if (!shop || !/^[a-zA-Z0-9.-]+.myshopify.com$/.test(shop)) {
    throw new Error('A valid shop identifier is required.');
  }

  const workspaceDir = path.resolve(process.cwd(), 'workspaces', shop, 'theme');
  const tempZipPath = path.join(workspaceDir, 'theme.zip');
  const sourceZipInBucket = 'themes/base/theme.zip';

  console.log(`[Theme Lib] Initializing base theme for ${shop} at ${workspaceDir}`);

  try {
    await rm(workspaceDir, { recursive: true, force: true });
    await mkdir(workspaceDir, { recursive: true });

    console.log(`[Theme Lib] Downloading ${sourceZipInBucket}...`);
    await bucket.file(sourceZipInBucket).download({ destination: tempZipPath });
    console.log('[Theme Lib] Download finished.');

    console.log(`[Theme Lib] Unzipping ${tempZipPath}...`);
    const stream = fs.createReadStream(tempZipPath).pipe(unzipper.Extract({ path: workspaceDir }));
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
    console.log('[Theme Lib] Unzip finished.');

    await unlink(tempZipPath);
    console.log('[Theme Lib] Deleted temporary zip file.');

    return workspaceDir;

  } catch (error) {
    console.error(`[Theme Lib] Failed to initialize theme for ${shop}:`, error);
    // Nettoyage en cas d'erreur
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {});
    // Propage l'erreur pour que l'appelant puisse la gérer
    throw error;
  }
}
