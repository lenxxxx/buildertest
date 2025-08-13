
import Docker from 'dockerode';

const docker = new Docker(); // Se connecte au socket Docker local par défaut

/**
 * Starts a Docker container for a specific shop session.
 * @param {string} shop The shop identifier.
 * @param {string} workspacePath The absolute path to the theme workspace on the host.
 * @returns {Promise<Docker.Container>} The started container object.
 */
export async function startSessionContainer(shop, workspacePath) {
  const containerName = `gemini-${shop}`;
  console.log(`[Docker] Starting session for ${shop} with container ${containerName}`);

  try {
    // 1. Vérifier si un conteneur existant peut être réutilisé
    let container = docker.getContainer(containerName);
    const info = await container.inspect().catch(() => null);

    if (info) {
      console.log(`[Docker] Found existing container ${containerName}.`);
      if (!info.State.Running) {
        console.log('[Docker] Container is stopped, starting it...');
        await container.start();
        console.log('[Docker] Container started.');
      } else {
        console.log('[Docker] Container is already running.');
      }
      return container;
    }
  } catch (error) {
    // Si le conteneur n'existe pas, on continue pour le créer
    if (error.statusCode !== 404) throw error;
    console.log(`[Docker] No existing container found for ${shop}. Creating a new one.`);
  }

  // 2. Créer et démarrer un nouveau conteneur
  console.log(`[Docker] Creating new container ${containerName}...`);
  const newContainer = await docker.createContainer({
    Image: 'gemini-shopify:stable',
    name: containerName,
    HostConfig: {
      Binds: [`${workspacePath}:/app`], // Montage du volume
      PortBindings: {
        '9292/tcp': [{ HostPort: '9292' }] // Mapping de port
      }
    }
  });

  console.log('[Docker] Container created, starting it...');
  await newContainer.start();
  console.log('[Docker] New container started successfully.');
  return newContainer;
}

/**
 * Stops and removes the Docker container for a specific shop session.
 * @param {string} shop The shop identifier.
 * @returns {Promise<void>}
 */
export async function stopSessionContainer(shop) {
  const containerName = `gemini-${shop}`;
  console.log(`[Docker] Stopping session for container ${containerName}`);

  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect().catch(() => null);

    if (!info) {
      console.log(`[Docker] Container ${containerName} not found, nothing to do.`);
      return;
    }

    console.log('[Docker] Stopping container...');
    await container.stop();
    console.log('[Docker] Removing container...');
    await container.remove();
    console.log(`[Docker] Container ${containerName} stopped and removed successfully.`);

  } catch (error) {
    // Gérer le cas où le conteneur a déjà été supprimé
    if (error.statusCode === 404) {
        console.log(`[Docker] Container ${containerName} was already removed.`);
        return;
    }
    console.error(`[Docker] Failed to stop/remove container ${containerName}:`, error);
    throw error;
  }
}
