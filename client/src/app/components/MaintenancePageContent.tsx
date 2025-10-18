'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, CalendarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'; // Icône pour planifier
import { Transition, Dialog } from '@headlessui/react'; // Pour la modale
import MaintenanceTaskCard from './MaintenanceTaskCard'; // Nous allons créer ce composant
import ScheduleTaskModal from './ScheduleTaskModal'; // Nous allons créer ce composant

interface Machine {
    id: string;
    name: string;
}

interface MaintenanceTask {
    id: string;
    machine_id: string;
    machine_name: string; // Ajouté pour l'affichage facile
    description: string;
    due_date: string;
    priority: 'Faible' | 'Moyenne' | 'Élevée' | 'Urgent';
    status: 'En attente' | 'En cours' | 'Terminé' | 'Annulé';
    assigned_to?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function MaintenancePageContent() {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]); // Pour le sélecteur dans la modale
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('Tous'); // 'Tous', 'En attente', 'En cours', 'Terminé', 'Annulé'
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        fetchTasks();
        fetchMachines(); // Récupérer la liste des machines pour la modale
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axios.get<MaintenanceTask[]>(`${API_BASE_URL}/maintenance-tasks/`);
            setTasks(response.data);
        } catch (err) {
            console.error('Failed to fetch maintenance tasks:', err);
            setError('Impossible de charger les tâches de maintenance.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const response = await axios.get<Machine[]>(`${API_BASE_URL}/machines/`);
            setMachines(response.data);
        } catch (err) {
            console.error('Failed to fetch machines for schedule modal:', err);
        }
    };

    const handleMarkAsComplete = async (taskId: string) => {
        try {
            await axios.put(`${API_BASE_URL}/maintenance-tasks/${taskId}/complete`);
            fetchTasks(); // Rafraîchir la liste des tâches
        } catch (err) {
            console.error('Failed to mark task as complete:', err);
            alert('Erreur lors de la mise à jour de la tâche.');
        }
    };

    const handleScheduleTask = async (taskData: Omit<MaintenanceTask, 'id' | 'machine_name'>) => {
        try {
            // Trouver le nom de la machine à partir de l'ID pour l'affichage (si non géré côté backend)
            const selectedMachine = machines.find(m => m.id === taskData.machine_id);
            const taskWithMachineName = {
                ...taskData,
                machine_name: selectedMachine ? selectedMachine.name : 'Inconnu'
            };

            await axios.post(`${API_BASE_URL}/maintenance-tasks/`, taskWithMachineName);
            fetchTasks(); // Rafraîchir la liste
            setIsModalOpen(false); // Fermer la modale
        } catch (err) {
            console.error('Failed to schedule task:', err);
            alert('Erreur lors de la planification de la tâche.');
        }
    };


    const filteredTasks = tasks.filter(task =>
        filterStatus === 'Tous' || task.status === filterStatus
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
            <div className="flex items-center mb-8">
                <WrenchScrewdriverIcon className="h-10 w-10 text-indigo-400 mr-4" />
                <h1 className="text-4xl font-bold text-gray-100">Gestion de la Maintenance</h1>
            </div>

            <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-4">
                    <label htmlFor="status-filter" className="text-lg font-medium text-gray-300">Statut :</label>
                    <select
                        id="status-filter"
                        className="bg-gray-700 border border-gray-600 text-gray-200 text-md rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="Tous">Tous</option>
                        <option value="En attente">En attente</option>
                        <option value="En cours">En cours</option>
                        <option value="Terminé">Terminé</option>
                        <option value="Annulé">Annulé</option>
                    </select>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out"
                >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Planifier une tâche
                </button>
            </div>

            {loading ? (
                <p className="text-center text-lg mt-10">Chargement des tâches de maintenance...</p>
            ) : error ? (
                <p className="text-center text-lg text-red-500 mt-10">{error}</p>
            ) : filteredTasks.length === 0 ? (
                <p className="text-center text-lg mt-10 text-gray-400">Aucune tâche de maintenance {filterStatus === 'Tous' ? '' : ` "${filterStatus}"`} trouvée.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) // Trier par date d'échéance
                        .map((task) => (
                        <MaintenanceTaskCard
                            key={task.id}
                            task={task}
                            onMarkAsComplete={handleMarkAsComplete}
                        />
                    ))}
                </div>
            )}

            <ScheduleTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSchedule={handleScheduleTask}
                machines={machines}
            />
        </div>
    );
}