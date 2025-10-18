import React from 'react';

interface Machine {
  id: string;
  name: string;
  location?: string;
  type?: string;
}

interface MachineCardProps {
  machine: Machine;
  onClick: () => void;
  isSelected: boolean;
}

export default function MachineCard({ machine, onClick, isSelected }: MachineCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 mb-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
        ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-600'}
        border border-gray-200 dark:border-gray-600`}
    >
      <h3 className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{machine.name}</h3>
      <p className={`text-sm ${isSelected ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}`}>
        {machine.type} - {machine.location}
      </p>
    </div>
  );
}