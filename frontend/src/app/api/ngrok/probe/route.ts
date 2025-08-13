// src/app/api/ngrok/probe/route.ts
import { NextResponse } from 'next/server';
import { getNgrokUrlOverSSH } from '@/lib/ssh';

export const runtime = 'nodejs';

function withSkip(urlStr: string) {
  const u = new URL(urlStr);
  // si déjà des params, on les complète ; sinon, on ajoute
  u.searchParams.set('ngrok-skip-browser-warning', 'true');
  u.searchParams.set('_ts', Date.now().toString());
  return u.toString();
}

export async function GET() {
  try {
    const base = await getNgrokUrlOverSSH();
    if (!base) {
      return NextResponse.json({ error: 'ngrok url not available' }, { status: 503 });
    }
    const url = withSkip(base);

    const headRes = await fetch(url, { method: 'HEAD' });
    const headStatus = headRes.status;
    const headType = headRes.headers.get('content-type');

    const getRes = await fetch(url, { method: 'GET' });
    const getStatus = getRes.status;
    const getType = getRes.headers.get('content-type') || '';
    const buf = await getRes.arrayBuffer();
    const text = Buffer.from(buf).toString('utf8');
    const snippet = text.slice(0, 600);

    return NextResponse.json({
      url,
      headStatus,
      headType,
      getStatus,
      getType,
      getLength: buf.byteLength,
      snippet,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
