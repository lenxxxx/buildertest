'use client';
import React from 'react';
import { ShopProvider } from '@/app/context/ShopContext';

export default function Providers({ children }) {
  return <ShopProvider>{children}</ShopProvider>;
}
