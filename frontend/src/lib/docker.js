import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';

// --- Docker Client Initialization ---
const dockerOptions = {};

if (process.env.DOCKER_HOST) {
  const hostUrl = new URL(process.env.DOCKER_HOST);
  dockerOptions.host = hostUrl.hostname;
  dockerOptions.port = hostUrl.port;

  if (process.env.DOCKER_TLS_VERIFY === '1' && process.env.DOCKER_CERT_PATH) {
    console.log('[Docker] Configuring client with TLS...');
    dockerOptions.ca = fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'ca.pem'));
    dockerOptions.cert = fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'cert.pem'));
    dockerOptions.key = fs.readFileSync(path.join(process.env.DOCKER_CERT_PATH, 'key.pem'));
  }
} else {
  // Fallback to Unix socket
  dockerOptions.socketPath = '/var/run/docker.sock';
}

const docker = new Docker(dockerOptions);

/**
 * Throws a formatted Docker error.
 * @param {Error} error The original error from Dockerode.
 * @param {string} context A string describing what was being attempted.
 */
function handleDockerError(error, context) {
  if (error.statusCode) {
    const errorMessage = error.json?.message || error.reason || 'Unknown Docker error';
    throw new Error(`Docker API Error during ${context} (${error.statusCode}): ${errorMessage}`);
  } else {
    throw new Error(`Docker Error during ${context}: ${error.message}`);
  }
}

export async function startSessionContainer(shop, workspacePath) {
  const containerName = `gemini-${shop}`;
  console.log(`[Docker] Starting session for container ${containerName}`);

  try {
    const existingContainer = docker.getContainer(containerName);
    const info = await existingContainer.inspect();
    console.log(`[Docker] Found existing container ${containerName}.`);
    if (!info.State.Running) {
      console.log('[Docker] Container is stopped, starting it...');
      await existingContainer.start();
    }
    return;
  } catch (error) {
    if (error.statusCode !== 404) {
      handleDockerError(error, `inspecting container ${containerName}`);
    }
  }

  try {
    console.log(`[Docker] Creating new container ${containerName}...`);
    const container = await docker.createContainer({
      Image: 'gemini-shopify:stable',
      name: containerName,
      HostConfig: {
        Binds: [`${workspacePath}:/app`],
        PortBindings: { '9292/tcp': [{ HostPort: '9292' }] },
      },
    });
    await container.start();
    console.log(`[Docker] New container ${containerName} started successfully.`);
  } catch (error) {
    handleDockerError(error, `creating/starting container ${containerName}`);
  }
}

export async function stopSessionContainer(shop) {
  const containerName = `gemini-${shop}`;
  console.log(`[Docker] Stopping session for container ${containerName}`);

  try {
    const container = docker.getContainer(containerName);
    await container.stop();
    await container.remove();
    console.log(`[Docker] Container ${containerName} stopped and removed.`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`[Docker] Container ${containerName} not found, nothing to do.`);
      return;
    }
    handleDockerError(error, `stopping/removing container ${containerName}`);
  }
}