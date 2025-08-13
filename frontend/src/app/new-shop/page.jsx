'use client';

import React, { useState } from 'react';
import { auth } from '@/app/lib/firebase'; // Importer l'instance d'auth
import { useAuthState } from 'react-firebase-hooks/auth';

const NewShopPage = () => {
  const [shopUrl, setShopUrl] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, authLoading] = useAuthState(auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (authLoading || !user) {
      setError('Veuillez vous connecter pour lier une boutique.');
      setIsLoading(false);
      return;
    }

    // 1. Normalize and validate the shop domain
    const rawShop = shopUrl.trim();
    let shop = rawShop.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!/\.myshopify\.com$/i.test(shop)) {
      setError('Veuillez entrer un domaine Shopify valide (ex: ma-boutique.myshopify.com)');
      setIsLoading(false);
      return;
    }

    try {
      // 2. Set the link_uid cookie via the init endpoint
      const idToken = await user.getIdToken();
      const initResponse = await fetch('/api/auth/link/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!initResponse.ok) {
        throw new Error('Impossible de préparer la liaison de la boutique.');
      }

      // 3. Redirect to the GET endpoint for OAuth initiation
      window.location.href = `/api/auth/start?shop=${encodeURIComponent(shop)}`;

    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Lier une boutique Shopify
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="shopUrl" className="text-sm font-medium text-gray-700">
              URL de la boutique
            </label>
            <input
              id="shopUrl"
              name="shopUrl"
              type="url"
              required
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              className="w-full px-3 py-2 mt-1 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://ma-boutique.myshopify.com"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Liaison en cours...' : 'Lier la boutique'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewShopPage;