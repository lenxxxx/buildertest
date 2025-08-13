
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { shopId, prompt } = await req.json();

  if (!shopId || !prompt) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Simuler réponse :
  return NextResponse.json({ assistant: '(Gemini simulé) Réponse à : ' + prompt });
}
