import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    return new Response('Unauthorized: Missing token', { status: 401 });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const response = new NextResponse(null, { status: 204 });

    response.cookies.set('link_uid', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    console.log('[auth/link/init] Set link_uid cookie for user.');
    return response;

  } catch (error) {
    console.error('[auth/link/init] Error verifying token:', error);
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }
}
