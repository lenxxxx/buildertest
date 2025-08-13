
import admin from 'firebase-admin';
import { mkdir, rm, unlink } from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import fs from 'fs';

// Assumes firebase-admin is initialized elsewhere, using an alias.
import '@/lib/firebase-admin.js';

const bucket = admin.storage().bucket();

/**
 * Initializes a theme workspace for a given shop.
 * @param {string} shop - The shop identifier.
 * @returns {Promise<string>} The absolute path to the theme workspace.
 */
export async function initBaseTheme(shop) {
  if (!shop) {
    throw new Error('A valid shop identifier is required.');
  }

  const workspaceDir = path.resolve(process.cwd(), 'workspaces', shop, 'theme');
  const tempZipPath = path.join(workspaceDir, 'theme.zip');
  const sourceZipInBucket = 'themes/base/theme.zip';

  console.log(`[Theme] Initializing base theme for ${shop} at ${workspaceDir}`);

  await rm(workspaceDir, { recursive: true, force: true });
  await mkdir(workspaceDir, { recursive: true });

  try {
    console.log(`[Theme] Downloading ${sourceZipInBucket}...`);
    await bucket.file(sourceZipInBucket).download({ destination: tempZipPath });
    console.log('[Theme] Download finished.');

    console.log(`[Theme] Unzipping ${tempZipPath}...`);
    const stream = fs.createReadStream(tempZipPath).pipe(unzipper.Extract({ path: workspaceDir }));
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    console.log('[Theme] Unzip finished.');

    await unlink(tempZipPath);
    return workspaceDir;
  } catch (error) {
    console.error(`[Theme] Failed to initialize theme for ${shop}:`, error);
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}
