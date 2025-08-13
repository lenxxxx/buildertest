
import React from 'react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-[#E0F2FF] to-[#FFFFFF]">
      <div className="container mx-auto px-4 text-center">
        <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-violet-100 text-sm text-gray-800 mb-6">
          ✨ Powered by Advanced AI
        </span>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#111827] leading-tight mb-4">
          Créez votre boutique <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Shopify</span> en quelques minutes avec l’IA
        </h1>
        <p className="text-lg md:text-xl text-[#4B5563] max-w-2xl mx-auto mt-4 mb-8">
          Lancez votre e-commerce sans effort. Notre IA génère produits, descriptions et design pour une boutique prête à vendre.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
          <button className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-violet-500 text-white px-8 py-3 rounded-full hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 8a2 2 0 11-4 0 2 2 0 014 0zM14.66 8.97a4.5 4.5 0 01-4.24 4.24l-1.89 1.89a.75.75 0 00.53 1.28h4.94a.75.75 0 00.53-1.28l-1.89-1.89a4.5 4.5 0 014.24-4.24zM10 18a8 8 0 100-16 8 8 0 000 16zM10 6a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            Créer ma boutique
          </button>
          <button className="px-8 py-3 rounded-full border border-[#D1D5DB] text-[#374151] hover:bg-gray-100 transition-all duration-300 ease-in-out">
            Voir la démo
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
