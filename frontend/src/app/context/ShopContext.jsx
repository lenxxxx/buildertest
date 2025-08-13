'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth, onAuthStateChanged } from '@/app/lib/firebase';
import { usePathname } from 'next/navigation';

export const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shopError, setShopError] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [hasShops, setHasShops] = useState(false);
  const pathname = usePathname();

  const refreshShops = useCallback(async () => {
    if (!user) return;
    setLoadingShops(true);
    try {
      const res = await fetch('/api/admin/shops', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch shops');
      const data = await res.json();
      const items = data.items || [];
      
      setShops(items);
      setHasShops(items.length > 0);

      if (items.length === 0) {
        setCurrentShop(null);
        localStorage.removeItem('shops');
        localStorage.removeItem('currentShop');
      } else {
        localStorage.setItem('shops', JSON.stringify(items));
        // Restore currentShop from localStorage or default to first
        const storedShopId = localStorage.getItem('currentShop');
        const shopToSelect = items.find(s => s.id === storedShopId) || items[0];
        setCurrentShop(shopToSelect);
      }
    } catch (err) {
      console.error('[ShopContext] refreshShops error', err);
      setShopError(err);
    } finally {
      setLoadingShops(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setShops([]);
        setCurrentShop(null);
        setLoadingShops(false);
        setHasShops(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Refresh shops when user is loaded or when navigating back to the dashboard
  useEffect(() => {
    if (user && pathname.includes('/dashboard')) {
      refreshShops();
    }
  }, [user, pathname, refreshShops]);

  const unlinkShop = async (shopDomain) => {
    // Immediately clear current shop if it's the one being unlinked
    if (currentShop?.shopDomain === shopDomain) {
      setCurrentShop(null);
    }
    await fetch(`/api/admin/shops/${encodeURIComponent(shopDomain)}/unlink`, { method: 'DELETE' });
    await refreshShops();
  };

  const createPreview = async (shopDomain) => {
    if (!user) throw new Error('User not authenticated.');
    
    const idToken = await user.getIdToken();
    const idemKey = crypto.randomUUID();

    const response = await fetch('/api/shops/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-Idem-Key': idemKey,
      },
      body: JSON.stringify({ shopDomain }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create preview: ${response.statusText}`);
    }
    return await response.json();
  };

  const selectShop = useCallback((shopId) => {
    const selected = shops.find(shop => shop.id === shopId);
    if (selected) {
      setCurrentShop(selected);
      localStorage.setItem('currentShop', selected.id);
    }
  }, [shops]);

  const contextValue = {
    user,
    shops,
    currentShop,
    selectShop,
    authLoading,
    loadingShops,
    shopError,
    hasShops,
    refreshShops,
    unlinkShop,
    createPreview,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (process.env.NODE_ENV !== 'production' && !ctx) {
    throw new Error('useShop() must be used within a ShopProvider.');
  }
  return ctx;
};

