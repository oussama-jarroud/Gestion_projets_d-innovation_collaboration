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
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
        ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}
        border border-gray-700`}
    >
      <h3 className={`text-md font-semibold ${isSelected ? 'text-white' : 'text-gray-100'}`}>{machine.name}</h3>
      <p className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
        {machine.type} - {machine.location}
      </p>
    </div>
  );
}