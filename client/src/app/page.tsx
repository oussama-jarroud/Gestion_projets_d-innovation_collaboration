'use client'; // Assurez-vous que c'est un client component

import React, { useState } from 'react';
import MachineList from '@/app/components/MachineList';
import AIAssistant from '@/app/components/AIAssistant'; // Importez le nouvel assistant IA

interface Machine {
  id: string;
  name: string;
  location?: string;
  type?: string;
  serial_number?: string;
  thresholds_config?: { [key: string]: any };
}

export default function Home() {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar de navigation ou liste de machines principale */}
      <aside className="w-64 p-4 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-400">
          Prédicteur Pro
        </h1>
        <nav className="flex-1">
          {/* Ici, vous pouvez ajouter d'autres liens de navigation si besoin */}
          <a
            href="#"
            className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
            Tableau de bord
          </a>
          {/* Ajoutez d'autres éléments de menu ici */}
        </nav>
        {/* Pied de page ou informations utilisateur */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0</p>
        </div>
      </aside>

      {/* Contenu principal (liste des machines et détails) */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8 text-indigo-700 dark:text-indigo-400">
          Surveillance Prédictive Industrielle
        </h1>
        <div className="w-full">
          {/* Passez setSelectedMachine à MachineList */}
          <MachineList onSelectMachine={setSelectedMachine} selectedMachineId={selectedMachine?.id} />
        </div>
      </main>

      {/* Sidebar de l'Assistant IA */}
      <aside className="w-[400px] p-4 bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <AIAssistant selectedMachine={selectedMachine} />
      </aside>
    </div>
  );
}