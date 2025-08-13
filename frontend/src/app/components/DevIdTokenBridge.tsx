
'use client';

import { useEffect } from 'react';
import { auth } from '@/app/lib/firebase';

// Add type definitions to the global Window interface for TypeScript
declare global {
  interface Window {
    __getIdToken: () => Promise<string | null>;
    __whoami: () => string | null;
  }
}

/**
 * A client component that bridges Firebase auth functions to the window object
 * for debugging purposes in development environments. It renders nothing.
 */
export default function DevIdTokenBridge() {
  // This component and its effects will do nothing in production.
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  useEffect(() => {
    // Attach debug functions to the window object.
    console.log('DEV: Attaching debug functions __getIdToken() and __whoami() to window.');

    window.__getIdToken = () => {
      if (!auth.currentUser) {
        console.log('__getIdToken: No user is currently signed in.');
        return Promise.resolve(null);
      }
      return auth.currentUser.getIdToken(true);
    };

    window.__whoami = () => {
      return auth.currentUser?.uid || null;
    };

    // Cleanup function to remove the helpers when the component unmounts.
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__getIdToken;
        delete (window as any).__whoami;
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  return null; // This component renders nothing to the DOM.
}
