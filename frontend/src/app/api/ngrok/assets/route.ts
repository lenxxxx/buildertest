// src/app/api/ngrok/assets/route.ts
import { NextResponse } from 'next/server';
import { getNgrokUrlOverSSH } from '@/lib/ssh';

export const runtime = 'nodejs';

function withParams(urlStr: string) {
  const u = new URL(urlStr);
  u.searchParams.set('ngrok-skip-browser-warning', 'true');
  u.searchParams.set('_ts', Date.now().toString());
  return u.toString();
}

export async function GET() {
  try {
    const base = await getNgrokUrlOverSSH();
    if (!base) return NextResponse.json({ error: 'ngrok url not available' }, { status: 503 });
    const baseUrl = withParams(base);

    const htmlRes = await fetch(baseUrl);
    const html = await htmlRes.text();

    const urls = new Set<string>();
    const scriptRe = /<script[^>]+src=["']([^"']+)["']/gi;
    const linkRe   = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;

    let m: RegExpExecArray | null;
    while ((m = scriptRe.exec(html)) && urls.size < 10) urls.add(m[1]);
    while ((m = linkRe.exec(html)) && urls.size < 10) urls.add(m[1]);

    const baseOrigin = new URL(baseUrl).origin;
    const assets = await Promise.all(
      Array.from(urls).map(async (raw) => {
        try {
          const abs = new URL(raw, baseUrl).toString()
            // force passer par le tunnel si l’URL est absolue sans ngrok
            .replace(/^https?:\/\/[^/]+/, baseOrigin);
          const r = await fetch(abs, { method: 'HEAD' });
          return { url: abs, status: r.status, type: r.headers.get('content-type') || '' };
        } catch (e: any) {
          return { url: raw, status: 0, type: `ERR:${e?.message || e}` };
        }
      })
    );

    return NextResponse.json({ baseUrl, assets });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
