'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/app/context/ShopContext';
import AuthGate from '@/app/components/AuthGate'; // Import AuthGate
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import { db } from '@/app/lib/firebase'; // Import db

export default function Page() {
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState(null);
  const { user } = useShop(); // Get user from ShopContext
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!shopName.trim()) {
      alert('Nom requis');
      return;
    }

    try {
      // 1. Créer le document de la boutique
      const shopDocRef = await addDoc(
        collection(db, 'users', user.uid, 'shops'),
        { name: shopName, createdAt: serverTimestamp() }
      );

      // 2. Ajouter le message de bienvenue dans la sous-collection
      await addDoc(
        collection(db, 'users', user.uid, 'shops', shopDocRef.id, 'messages'),
        {
          text: "Bienvenue dans votre assistant boutique ! Posez-moi vos questions ici.",
          sender: "assistant", // Cohérent avec le ChatPanel
          createdAt: serverTimestamp()
        }
      );

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error("Failed to create shop:", err);
    }
  };

  return (
    <AuthGate>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Créer votre première boutique
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="shopName" className="text-sm font-medium text-gray-700">
                Nom de la boutique
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 mt-1 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ma Super Boutique"
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
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Créer la boutique
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGate>
  );
}