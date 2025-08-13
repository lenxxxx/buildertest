import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { shopName, apiKey } = await request.json();

    if (!shopName || !apiKey) {
      return NextResponse.json({ error: 'Champs requis' }, { status: 400 });
    }

    console.log('Received shop creation request:', { shopName, apiKey });

    // Simulate successful registration
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(" Création boutique ERREUR:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}