'use client';

import React from 'react';
import { useShop } from '@/app/context/ShopContext';

const ShopList = () => {
  const { shops, currentShop, selectShop, loadingShops, shopError } = useShop();

  if (loading) {
    return <div className="p-4 text-gray-400">Loading shops...</div>;
  }

  if (shopsError) {
    return <div className="p-4 text-red-500">Impossible de charger les boutiques.</div>;
  }

  return (
    <div className="w-32 min-w-[128px] bg-gray-800 text-white flex flex-col">
      <h2 className="text-lg font-bold p-4 border-b border-gray-700">My Shops</h2>
      <ul className="flex-grow overflow-y-auto">
        {shops.length === 0 ? (
          <li className="p-4 text-gray-400">Aucune boutique trouvée – créez-en une.</li>
        ) : (
          shops.map((shop) => (
            <li
              key={shop.id}
              className={`p-4 cursor-pointer hover:bg-gray-700 ${currentShop && currentShop.id === shop.id ? 'bg-blue-600' : ''}`}
              onClick={() => setCurrentShop(shop.id)}
            >
              {shop.name}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ShopList;