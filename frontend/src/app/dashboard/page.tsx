'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AuthGate from '@/app/components/AuthGate';
import ShopSidebar from '@/app/components/ShopSidebar';
import ChatPanel from '@/app/components/ChatPanel';
import PreviewPane from '@/app/components/PreviewPane';
import { useShop } from '@/app/context/ShopContext';

export default function DashboardPage() {
  const {
    shops,
    currentShop,
    selectShop,
    loadingShops,
    authLoading,
    hasShops,
    createPreview,
  } = useShop();

  const [openUrl, setOpenUrl] = useState(null);
  const [previewStatus, setPreviewStatus] = useState('idle');
  const [isCreating, setIsCreating] = useState(false);

  // Auto-select the first shop if none is selected
  useEffect(() => {
    if (!authLoading && !loadingShops && hasShops && !currentShop) {
      selectShop(shops[0].id);
    }
  }, [authLoading, loadingShops, shops, currentShop, selectShop, hasShops]);
  
  // Reset state when shop changes
  useEffect(() => {
    setOpenUrl(null);
    setPreviewStatus(hasShops ? 'idle' : 'no-shop');
  }, [currentShop, hasShops]);


  const handleCreatePreview = useCallback(async () => {
    if (!currentShop) {
      setPreviewStatus('no-shop');
      return;
    }

    setIsCreating(true);
    setOpenUrl(null);
    setPreviewStatus('starting');

    try {
      const result = await createPreview(currentShop.shopDomain);
      if (result.ok && result.themeId) {
        setOpenUrl(result.openUrl);
        setPreviewStatus('ready');
      } else {
        throw new Error(result.error || 'Failed to create preview.');
      }
    } catch (err) {
      console.error('handleCreatePreview failed:', err);
      if (err.message === 'shop-not-found') {
        setPreviewStatus('shop-not-found');
      } else {
        setPreviewStatus('error');
      }
    } finally {
      setIsCreating(false);
    }
  }, [currentShop, createPreview]);

  return (
    <AuthGate>
      <div className="grid grid-cols-12 h-screen bg-white font-sans">
        <div className="col-span-2">
          <ShopSidebar />
        </div>
        <div className="col-span-6">
          <ChatPanel />
        </div>
        <div className="col-span-4">
          <PreviewPane
            // For MVP, previewUrl is always null as we disabled ngrok
            previewUrl={null} 
            openUrl={openUrl}
            status={previewStatus}
            onRetry={handleCreatePreview} // The button is now the primary action
            isCreating={isCreating}
          />
        </div>
      </div>
    </AuthGate>
  );
}
