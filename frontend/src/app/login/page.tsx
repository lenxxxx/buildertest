'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebase';
import AuthForm from '@/app/login/AuthForm';

const LoginPage = () => {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // Si le chargement est terminé et que l'utilisateur est authentifié,
    // on le redirige vers le tableau de bord.
    if (!loading && user) {
      console.log('[Login Page] User already authenticated. Redirecting to /dashboard.');
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Affiche un loader pendant que l'état d'authentification est vérifié
  if (loading) {
    return <div>Chargement...</div>;
  }

  // Si l'utilisateur n'est pas connecté, on affiche le formulaire
  return (
    <AuthForm />
  );
};

export default LoginPage;