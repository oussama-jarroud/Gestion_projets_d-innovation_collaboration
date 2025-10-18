// frontend/components/ScheduleTaskModal.tsx
'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Machine {
    id: string;
    name: string;
}

interface ScheduleTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (taskData: {
        machine_id: string;
        description: string;
        due_date: string;
        priority: 'Faible' | 'Moyenne' | 'Élevée' | 'Urgent';
        assigned_to: string;
        status: 'En attente' | 'En cours' | 'Terminé' | 'Annulé';
    }) => void;
    machines: Machine[];
}

export default function ScheduleTaskModal({ isOpen, onClose, onSchedule, machines }: ScheduleTaskModalProps) {
    const [machineId, setMachineId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [priority, setPriority] = useState<'Faible' | 'Moyenne' | 'Élevée' | 'Urgent'>('Moyenne');
    const [assignedTo, setAssignedTo] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!machineId || !description || !dueDate || !priority || !assignedTo) {
            alert('Veuillez remplir tous les champs.');
            return;
        }
        onSchedule({
            machine_id: machineId,
            description,
            due_date: dueDate,
            priority,
            assigned_to: assignedTo,
            status: 'En attente', // Nouvelle tâche est toujours en attente
        });
        // Réinitialiser le formulaire
        setMachineId('');
        setDescription('');
        setDueDate('');
        setPriority('Moyenne');
        setAssignedTo('');
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-75" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-2xl font-bold leading-6 text-gray-100 flex justify-between items-center"
                                >
                                    Planifier une Nouvelle Tâche
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-100">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </Dialog.Title>
                                <div className="mt-6">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label htmlFor="machine" className="block text-sm font-medium text-gray-300">Machine</label>
                                            <select
                                                id="machine"
                                                value={machineId}
                                                onChange={(e) => setMachineId(e.target.value)}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            >
                                                <option value="">Sélectionnez une machine</option>
                                                {machines.map((machine) => (
                                                    <option key={machine.id} value={machine.id}>
                                                        {machine.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                                            <textarea
                                                id="description"
                                                rows={3}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300">Date d'échéance</label>
                                            <input
                                                type="date"
                                                id="dueDate"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="priority" className="block text-sm font-medium text-gray-300">Priorité</label>
                                            <select
                                                id="priority"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value as 'Faible' | 'Moyenne' | 'Élevée' | 'Urgent')}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            >
                                                <option value="Faible">Faible</option>
                                                <option value="Moyenne">Moyenne</option>
                                                <option value="Élevée">Élevée</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-300">Assigné à</label>
                                            <input
                                                type="text"
                                                id="assignedTo"
                                                value={assignedTo}
                                                onChange={(e) => setAssignedTo(e.target.value)}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Nom du technicien/ingénieur"
                                                required
                                            />
                                        </div>
                                        <div className="mt-6 flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            >
                                                Planifier la tâche
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}