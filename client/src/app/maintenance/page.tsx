'use client';

import React, { useState } from 'react';
import { CalendarDaysIcon, WrenchScrewdriverIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MaintenanceTask {
  id: string;
  machineName: string;
  type: string;
  dueDate: string;
  status: 'En attente' | 'En cours' | 'Terminé' | 'Annulé';
  priority: 'Faible' | 'Moyenne' | 'Élevée';
  assignedTo: string;
}
const dummyMaintenanceTasks: MaintenanceTask[] = [
  { id: 'm1', machineName: 'Broyeur Alpha', type: 'Inspection Préventive', dueDate: '2023-11-15', status: 'En attente', priority: 'Moyenne', assignedTo: 'Jean Dupont' },
  { id: 'm2', machineName: 'Presse Hydraulique Beta', type: 'Changement de Filtre', dueDate: '2023-11-08', status: 'En cours', priority: 'Élevée', assignedTo: 'Marie Curie' },
  { id: 'm3', machineName: 'Convoyeur Delta', type: 'Lubrification', dueDate: '2023-10-28', status: 'Terminé', priority: 'Faible', assignedTo: 'Pierre Simon' },
  { id: 'm4', machineName: 'Robot Bras Articulé', type: 'Vérification Capteurs', dueDate: '2023-12-01', status: 'En attente', priority: 'Moyenne', assignedTo: 'Jean Dupont' },
];

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(dummyMaintenanceTasks);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'En attente': return 'bg-yellow-800 text-yellow-300';
      case 'En cours': return 'bg-blue-800 text-blue-300';
      case 'Terminé': return 'bg-green-800 text-green-300';
      case 'Annulé': return 'bg-red-800 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getPriorityColorClass = (priority: string) => {
    switch (priority) {
      case 'Élevée': return 'text-red-400';
      case 'Moyenne': return 'text-orange-400';
      case 'Faible': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };
  const handleMarkAsComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: 'Terminé' } : task
      )
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-gray-100"> {/* Ajout de min-h-screen et couleurs */}
      <h1 className="text-3xl font-bold text-gray-100 mb-6 flex items-center">
        <WrenchScrewdriverIcon className="h-8 w-8 text-indigo-400 mr-3" />
        Gestion de la Maintenance
      </h1>

      <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <label htmlFor="filterStatus" className="text-gray-300">Statut :</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-gray-100 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Annulé">Annulé</option>
          </select>
        </div>
        <button
            onClick={() => alert('Fonctionnalité "Planifier une tâche" à implémenter')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center"
        >
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            Planifier une tâche
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">Aucune tâche de maintenance à afficher.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-100">{task.machineName}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-gray-300 mb-1">{task.type}</p>
                <p className="text-gray-400 text-sm mb-1">
                  Due le: <span className="font-semibold">{task.dueDate}</span>
                </p>
                <p className="text-gray-400 text-sm mb-2">
                  Priorité: <span className={`font-semibold ${getPriorityColorClass(task.priority)}`}>{task.priority}</span>
                </p>
                <p className="text-gray-500 text-xs">Assigné à: {task.assignedTo}</p>
                {task.status !== 'Terminé' && (
                    <button
                        onClick={() => handleMarkAsComplete(task.id)} 
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md flex items-center justify-center"
                    >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Marquer comme terminé
                    </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}