
import React from 'react';

const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-[#111827] mb-12">Nos Fonctionnalités Clés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Placeholder Feature Card 1 */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-[#111827] mb-4">Génération de Produits IA</h3>
            <p className="text-[#4B5563]">Créez des descriptions de produits uniques et optimisées pour le SEO en quelques secondes.</p>
          </div>
          {/* Placeholder Feature Card 2 */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-[#111827] mb-4">Design de Boutique Personnalisé</h3>
            <p className="text-[#4B5563]">Laissez l'IA concevoir un thème Shopify qui correspond parfaitement à votre marque.</p>
          </div>
          {/* Placeholder Feature Card 3 */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-[#111827] mb-4">Optimisation Marketing Intégrée</h3>
            <p className="text-[#4B5563]">Obtenez des suggestions pour vos campagnes marketing et vos publicités.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
