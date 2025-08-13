"use client";

import React, { useState } from 'react';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, googleProvider } from '@/app/lib/firebase';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setIsLoading(true);
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      const token = await userCredential.user.getIdToken();
      setCookie('token', token, { path: '/' });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      console.error('[login error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
      setCookie('token', token, { path: '/' });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      console.error('[login error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 text-center rounded-t-lg ${isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setIsLogin(true)}
          >
            Connexion
          </button>
          <button
            className={`flex-1 py-2 text-center rounded-t-lg ${!isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setIsLogin(false)}
          >
            Inscription
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-[#111827]">
          {isLogin ? 'Se connecter' : 'Créer un compte'}
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : (isLogin ? 'Se connecter' : 'Créer un compte')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C293.4 115.1 261.8 104 248 104c-71.9 0-130.1 58.6-130.1 130.1c0 71.9 58.6 130.1 130.1 130.1c81.9 0 109.1-31.1 113.4-56.8h-113.4v-48h222.7c2.6 14.1 3.9 29.2 3.9 45.1z"></path></svg>
            Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;