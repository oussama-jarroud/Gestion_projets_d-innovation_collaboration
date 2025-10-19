import React from 'react';

export default function Header() {
  return (
    <header className="bg-gray-800 dark:bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold text-gray-100">
        GESTION DE PROJETS D'INNOVATION
        <span className="block text-sm font-normal text-gray-400">Surveillance Prédictive Industrielle</span>
      </h1>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400">Version 1.0 - PROJET INTERNE</span>
        
      </div>
    </header>
  );
}