'use client';

import React, { useState, useEffect } from 'react';
import MachineCard from '@/app/components/MachineCard'; 
import AIAssistant from '@/app/components/AIAssistant';
import MachineDetailsContent from '@/app/components/MachineDetailsContent'; 
import axios from 'axios';

interface Machine {
  id: string;
  name: string;
  location?: string;
  type?: string;
  serial_number?: string;
  thresholds_config?: { [key: string]: any };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function DashboardPage() { 
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get<Machine[]>(`${API_BASE_URL}/machines/`);
        setMachines(response.data);
        if (response.data.length > 0) {
          setSelectedMachine(response.data[0]); 
        }
      } catch (err) {
        console.error('Failed to fetch machines:', err);
        setError('Impossible de charger la liste des machines.');
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  if (loading) return <p className="text-center text-lg mt-4 text-gray-300">Chargement des machines...</p>;
  if (error) return <p className="text-center text-lg text-red-500 mt-4">{error}</p>;
  if (machines.length === 0) return <p className="text-center text-lg mt-4 text-gray-300">Aucune machine enregistrée.</p>;


  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Colonne gauche pour la liste des machines */}
      <div className="col-span-2 flex flex-col overflow-hidden bg-gray-800 rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4 text-indigo-400">Machines</h2>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"> {/* Ajout de custom-scrollbar */}
          {machines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onClick={() => setSelectedMachine(machine)}
              isSelected={selectedMachine?.id === machine.id}
            />
          ))}
        </div>
      </div>

      {/* Colonne centrale pour les détails de la machine et le graphique */}
      <div className="col-span-7 flex flex-col space-y-6">
        {selectedMachine ? (
          <MachineDetailsContent machine={selectedMachine} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg shadow-lg">
            <p className="text-gray-400 text-lg">Sélectionnez une machine pour voir ses détails.</p>
          </div>
        )}
      </div>

      {/* Colonne droite pour l'Assistant IA et les KPIs */}
      <div className="col-span-3 flex flex-col space-y-6">
        {/* KPIs (simulé pour l'instant) */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 h-64 flex flex-col justify-center items-center">
          <h3 className="text-xl font-semibold mb-4 text-indigo-400">Indicateurs Clés (KPI)</h3>
          <div className="flex justify-around w-full mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">78% ↓</p>
              <p className="text-sm text-gray-400">Coûts Maintenance Réduits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">15% ↑</p>
              <p className="text-sm text-gray-400">Pannes Évitées</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            (Ces valeurs sont actuellement simulées pour démonstration)
          </p>
        </div>
        {/* Assistant IA */}
        <div className="flex-1 bg-gray-800 rounded-lg shadow-lg">
          <AIAssistant selectedMachine={selectedMachine} />
        </div>
      </div>
    </div>
  );
}