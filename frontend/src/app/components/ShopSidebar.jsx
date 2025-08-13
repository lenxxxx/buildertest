
'use client';
import React from 'react';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';

export default function ShopSidebar() {
  const shopCtx = useShop();
  console.log('[ShopSidebar] shopCtx →', shopCtx);

  if (!shopCtx || shopCtx.loading) {
    return (
        <aside className="flex flex-col bg-gray-50 border-r border-gray-200 h-screen p-4">
            <div className="text-center text-gray-500">Chargement des boutiques...</div>
        </aside>
    );
  }

  const { shops, currentShop, selectShop } = shopCtx;
  const hasShops = shops && shops.length > 0;

  return (
    <aside className="flex flex-col bg-gray-50 border-r border-gray-200 h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Mes boutiques</h2>
      </div>

      <div className="flex-grow overflow-y-auto">
        {!hasShops && (
          <div className="p-4 text-center text-gray-500">
            <p className="mb-4">Aucune boutique pour l’instant.</p>
            <Link href="/create-shop" passHref>
              <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-200">
                Lier ma première boutique
              </button>
            </Link>
          </div>
        )}

        {hasShops && (
          <nav>
            <ul>
              {shops.map((shop) => (
                <li key={shop.id}>
                  <button
                    onClick={() => selectShop(shop.id)}
                    className={`w-full text-left p-4 text-sm flex items-center gap-3 transition-colors duration-150 ${
                      currentShop?.id === shop.id
                        ? 'bg-blue-100 border-r-4 border-blue-500 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    aria-current={currentShop?.id === shop.id ? 'page' : undefined}
                  >
                    <span className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full"></span>
                    <span className="truncate">{shop.name || shop.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <Link href="/new-shop" passHref>
           <button className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200">
            <span>+ Nouvelle boutique</span>
          </button>
        </Link>
      </div>
    </aside>
  );
}
