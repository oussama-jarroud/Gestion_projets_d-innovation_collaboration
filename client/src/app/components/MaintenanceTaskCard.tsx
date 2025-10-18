// frontend/components/MaintenanceTaskCard.tsx
import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface MaintenanceTask {
    id: string;
    machine_id: string;
    machine_name: string;
    description: string;
    due_date: string;
    priority: 'Faible' | 'Moyenne' | 'Élevée' | 'Urgent';
    status: 'En attente' | 'En cours' | 'Terminé' | 'Annulé';
    assigned_to?: string;
}

interface MaintenanceTaskCardProps {
    task: MaintenanceTask;
    onMarkAsComplete: (taskId: string) => void;
}

const getStatusColors = (status: string) => {
    switch (status) {
        case 'En attente': return 'bg-yellow-500 text-gray-900';
        case 'En cours': return 'bg-blue-500 text-white';
        case 'Terminé': return 'bg-green-600 text-white';
        case 'Annulé': return 'bg-gray-500 text-white';
        default: return 'bg-gray-400 text-gray-900';
    }
};

const getPriorityColors = (priority: string) => {
    switch (priority) {
        case 'Faible': return 'text-green-400';
        case 'Moyenne': return 'text-yellow-400';
        case 'Élevée': return 'text-orange-400';
        case 'Urgent': return 'text-red-400';
        default: return 'text-gray-400';
    }
};

export default function MaintenanceTaskCard({ task, onMarkAsComplete }: MaintenanceTaskCardProps) {
    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-100">{task.machine_name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColors(task.status)}`}>
                        {task.status}
                    </span>
                </div>
                <p className="text-gray-300 text-lg mb-2">{task.description}</p>
                <p className="text-gray-400 text-sm mb-1">
                    **Due le:** {new Date(task.due_date).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-sm mb-1">
                    **Priorité:** <span className={getPriorityColors(task.priority)}>{task.priority}</span>
                </p>
                {task.assigned_to && (
                    <p className="text-gray-400 text-sm mb-4">
                        **Assigné à:** {task.assigned_to}
                    </p>
                )}
            </div>

            {task.status !== 'Terminé' && task.status !== 'Annulé' && (
                <button
                    onClick={() => onMarkAsComplete(task.id)}
                    className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition duration-300 ease-in-out"
                >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Marquer comme terminé
                </button>
            )}
        </div>
    );
}