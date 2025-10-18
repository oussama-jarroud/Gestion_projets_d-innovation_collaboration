'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MachineCard from './MachineCard';
import MachineDetails from './MachineDetails';

interface Machine {
  id: string;
  name: string;
  location?: string;
  type?: string;
  serial_number?: string;
  thresholds_config?: { [key: string]: any }; // Inclure ceci pour l'affichage des détails
}

interface MachineListProps {
  onSelectMachine: (machine: Machine | null) => void;
  selectedMachineId?: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function MachineList({ onSelectMachine, selectedMachineId }: MachineListProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  // const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null); // N'est plus géré ici directement
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get<Machine[]>(`${API_BASE_URL}/machines/`);
        setMachines(response.data);
        // Si une machine était déjà sélectionnée (ex: après un refresh), la re-sélectionner
        if (selectedMachineId) {
            const prevSelected = response.data.find(m => m.id === selectedMachineId);
            if (prevSelected) {
                onSelectMachine(prevSelected);
            } else if (response.data.length > 0) {
                onSelectMachine(response.data[0]); // Sélectionne la première par défaut
            }
        } else if (response.data.length > 0) {
            onSelectMachine(response.data[0]); // Sélectionne la première machine par défaut
        }
      } catch (err) {
        console.error('Failed to fetch machines:', err);
        setError('Impossible de charger la liste des machines.');
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []); // Exécuter une seule fois au montage

  if (loading) return <p className="text-center text-lg mt-4">Chargement des machines...</p>;
  if (error) return <p className="text-center text-lg text-red-500 mt-4">{error}</p>;
  if (machines.length === 0) return <p className="text-center text-lg mt-4">Aucune machine enregistrée.</p>;


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 p-4 bg-white dark:bg-gray-800 shadow rounded-lg h-full overflow-y-auto max-h-[80vh]">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Machines Enregistrées</h2>
        {machines.map((machine) => (
          <MachineCard
            key={machine.id}
            machine={machine}
            onClick={() => onSelectMachine(machine)} // Appelle la prop du parent
            isSelected={selectedMachineId === machine.id} // Utilise la prop du parent
          />
        ))}
      </div>
      <div className="md:col-span-2 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
        {selectedMachineId ? (
          <MachineDetails machine={machines.find(m => m.id === selectedMachineId)!} />
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg mt-20">Sélectionnez une machine pour voir ses détails.</p>
        )}
      </div>
    </div>
  );
}