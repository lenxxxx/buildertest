
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, signOut, onAuthStateChanged } from '@/app/lib/firebase';

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

    const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.warn('[REDIR-SRC]', 'src/app/components/Header.jsx', 24);
      // router.push('/login'); // Redirection après déconnexion
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-[#111827] font-bold text-xl font-inter">
          ShopifyAI
        </div>
        <nav className="hidden md:flex space-x-6 text-sm text-[#374151]">
          <a href="#" className="hover:text-gray-900">Fonctionnalités</a>
          <a href="#" className="hover:text-gray-900">Tarifs</a>
          <a href="#" className="hover:text-gray-900">À propos</a>
        </nav>
        {
          user ? (
            <div className="flex items-center space-x-4">
              <span className="text-[#374151]">Mon compte</span>
              <button
                onClick={handleSignOut}
                className="bg-gradient-to-r from-[#7F5AF0] to-[#4CB8FF] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-gradient-to-r from-[#7F5AF0] to-[#4CB8FF] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                Se connecter
              </button>
            </Link>
          )
        }
      </div>
    </header>
  );
};

export default Header;
