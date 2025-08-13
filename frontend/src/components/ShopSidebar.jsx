
'use client';

import { useShop } from '@/app/context/ShopContext';
import Link from 'next/link';

export default function ShopSidebar() {
  const { shops, selectedShop, setSelectedShop, loading } = useShop();

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-400">Chargement des boutiques...</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 mb-4">Aucune boutique n'est liée à votre compte.</p>
        <Link href="/create-shop" legacyBehavior>
          <a className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Lier une nouvelle boutique
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Vos Boutiques</h2>
      <ul>
        {shops.map((shop) => (
          <li key={shop.id}>
            <button
              onClick={() => setSelectedShop(shop)}
              className={`w-full text-left px-3 py-2 rounded-md ${selectedShop?.id === shop.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
              {shop.name || shop.id} 
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
