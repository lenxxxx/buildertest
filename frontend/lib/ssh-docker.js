import { NodeSSH } from 'node-ssh'
import path from 'path'

const ssh = new NodeSSH()

async function connect() {
  await ssh.connect({
    host: process.env.SSH_HOST,
    username: process.env.SSH_USER,
    privateKey: process.env.SSH_KEY_PATH,
  })
}

export async function runDockerCommand(shop, command) {
  /**
   * @param shop   le nom de la boutique (ex: 'ma-boutique.myshopify.com')
   * @param command le sous-commande Docker à exécuter dans le conteneur,
   *                p. ex. "exec gemini-ma-boutique.myshopify.com shopify theme dev --host 0.0.0.0"
   */
  const containerName = `gemini-${shop}`
  await connect()
  // on exécute la commande Docker via SSH
  const full = `docker ${command.replace(/\{container\}/g, containerName)}`
  const result = await ssh.execCommand(full, { cwd: `/home/${process.env.SSH_USER}` })
  ssh.dispose()
  if (result.stderr) throw new Error(result.stderr)
  return result.stdout
}
