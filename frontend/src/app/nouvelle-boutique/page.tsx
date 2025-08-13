
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NouvelleBoutiquePage = () => {
  const [shopName, setShopName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [errors, setErrors] = useState<{ shopName?: string; apiKey?: string }>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { shopName?: string; apiKey?: string } = {};
    if (!shopName.trim()) {
      newErrors.shopName = 'Le nom de la boutique est requis.';
    }
    if (!apiKey.trim()) {
      newErrors.apiKey = 'La clé API AI Studio est requise.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ shopName, apiKey })
      });

      const json = await response.json();
      console.log("POST /api/shops", json);

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setApiError(json.error || "Erreur interne");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la boutique:", error);
      setApiError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-[#111827] mb-8">Créer une nouvelle boutique</h1>

      <div className="max-w-xl w-full bg-white p-6 rounded-lg shadow-md">
        {apiError && <p className="text-red-500 text-center mb-4">{apiError}</p>}
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">Nom de la boutique</label>
            <input
              type="text"
              id="shopName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ma super boutique"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              disabled={isLoading}
            />
            {errors.shopName && <p className="mt-1 text-sm text-red-600">{errors.shopName}</p>}
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">Clé API AI Studio</label>
            <input
              type="text"
              id="apiKey"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              disabled={isLoading}
            />
            {errors.apiKey && <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#7F5AF0] to-[#4CB8FF] hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer et continuer'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
};

export default NouvelleBoutiquePage;
