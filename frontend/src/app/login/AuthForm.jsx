'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  auth,
  googleProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  onAuthStateChanged
} from '@/app/lib/firebase';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const router = useRouter();

  // Correction : Gérer la redirection après l'état d'authentification
  /* TEST OFF
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        // Reste sur /login si pas d'utilisateur
      }
    });
    return () => unsubscribe();
  }, [router]);
  */

  const handleAuthAction = async (e) => {
    console.log('[AuthForm] handleSubmit isLogin=', isLogin);
    e.preventDefault();
    setAuthError(null);

    try {
      let userCredential;
      if (isLogin) {
        console.log('[AuthForm] calling Firebase');
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        console.log('[AuthForm] calling Firebase');
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      console.log('[AuthForm] Firebase OK, uid=', userCredential.user.uid);
      const token = await userCredential.user.getIdToken();
      document.cookie = `token=${token}; path=/`;
      router.push('/dashboard');  // navigation simple
      console.log('[AuthForm] to /dashboard');
    } catch (error) {
      console.error('[AuthForm] auth error', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      console.log('[AuthForm] calling Firebase');
      await signInWithPopup(auth, googleProvider);
      console.log('[AuthForm] Firebase OK, uid=', auth.currentUser.uid);
      const token = await auth.currentUser.getIdToken();
      document.cookie = `token=${token}; path=/`;
      router.push('/dashboard');  // navigation simple
      console.log('[AuthForm] to /dashboard');
    } catch (error) {
      console.error('[AuthForm] auth error', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {isLogin ? 'Se connecter' : 'Créer un compte'}
        </h2>
        <form onSubmit={handleAuthAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Adresse e-mail"
            />
          </div>
          <div>
            <label htmlFor="password"
                   className="text-sm font-medium text-gray-700 sr-only">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Mot de passe"
            />
          </div>
          {authError && (
            <p className="text-sm text-red-600">
              {authError}
            </p>
          )}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLogin ? 'Se connecter' : 'Créer un compte'}
            </button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
          </div>
        </div>
        <div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Google
          </button>
        </div>
        <div className="text-sm text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isLogin ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;