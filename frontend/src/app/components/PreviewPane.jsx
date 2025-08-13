'use client';
import React from 'react';

const StatusDisplay = ({ status, onRetry, isCreating }) => {
  const statusMessages = {
    starting: 'Création en cours...',
    error: 'Une erreur est survenue.',
    'shop-not-found': 'Cette boutique n’est pas liée à votre compte.',
    'no-shop': 'Aucune boutique sélectionnée.',
    idle: 'Prêt à créer une prévisualisation.',
  };

  const showButton = ['idle', 'error', 'shop-not-found'].includes(status);
  const buttonText = status === 'error' ? '↻ Réessayer' : 'Créer la prévisualisation';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4">
      <p className="font-semibold">{statusMessages[status] || 'Veuillez patienter...'}</p>
      {showButton && (
        <button
          onClick={onRetry}
          disabled={isCreating}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
        >
          {isCreating ? 'Création...' : buttonText}
        </button>
      )}
      <div className="mt-2 text-xs text-gray-400">Status: {status}</div>
    </div>
  );
};

export default function PreviewPane({ openUrl, status, onRetry, isCreating }) {
  return (
    <section className="flex flex-col bg-gray-100 h-screen border-l border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Prévisualisation</h2>
        {openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-bold"
          >
            Ouvrir la prévisualisation ↗
          </a>
        )}
      </div>
      <div className="flex-grow bg-white">
        {status === 'ready' && openUrl ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4">
             <p className="font-semibold text-green-600">Prévisualisation prête !</p>
             <p className="text-sm mt-2">Cliquez sur le bouton "Ouvrir" ci-dessus pour la voir dans un nouvel onglet.</p>
           </div>
        ) : (
          <StatusDisplay status={status} onRetry={onRetry} isCreating={isCreating} />
        )}
      </div>
    </section>
  );
}
