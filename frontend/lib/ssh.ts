import 'server-only';

export async function ensurePreviewContainer() {
  console.warn('[ssh] stub ensurePreviewContainer (preview désactivée pour le MVP)');
  return { ok: true, stub: true };
}

export async function ensureNgrokTunnel() {
  console.warn('[ssh] stub ensureNgrokTunnel');
  return;
}

export async function getNgrokUrlOverSSH(): Promise<string | null> {
  console.warn('[ssh] stub getNgrokUrlOverSSH');
  return null;
}