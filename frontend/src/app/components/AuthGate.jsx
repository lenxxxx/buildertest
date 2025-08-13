'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useShop } from '@/app/context/ShopContext';

export default function AuthGate({ children }) {
  const context = useShop();
  console.log('[AuthGate] shopCtx →', context);

  if (!context) {
    return <div className="flex items-center justify-center h-screen">Initialisation...</div>;
  }

  const { user, loading } = context;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // On attend que le chargement initial (auth + shops) soit terminé
    if (loading) {
      return;
    }

    // Si le chargement est terminé et qu'il n'y a pas d'utilisateur, on redirige vers le login
    if (!user && pathname !== '/login') {
      console.log('[AuthGate] No user found, redirecting to /login');
      router.replace('/login');
    }

  }, [user, loading, pathname, router]);

  // Pendant que le contexte se charge, on affiche un loader
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement de la session...</div>;
  }

  // Si le chargement est terminé et que l'utilisateur est là, on affiche la page
  if (user) {
    return <>{children}</>;
  }

  // Si le chargement est terminé et qu'il n'y a pas d'utilisateur, on n'affiche rien (la redirection a lieu dans useEffect)
  return null;
}