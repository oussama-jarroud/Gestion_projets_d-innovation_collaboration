'use client';

import React, { useState, useEffect } from 'react';
import { FunnelIcon, MagnifyingGlassIcon, CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';


interface LogEntry {
    id: string;
    timestamp: string;
    type: string;
    machine_id?: string;
    machine_name?: string; 
    severity?: 'Avertissement' | 'Critique' | 'Urgence';
    message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function HistoryPage() {
    const [history, setHistory] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const alertsResponse = await axios.get(`${API_BASE_URL}/alerts/?limit=20`);

                const fetchedLogs: LogEntry[] = await Promise.all(alertsResponse.data.map(async (alert: any) => {
                    let machineName = 'N/A';
                    if (alert.machine_id) {
                        try {
                            const machineRes = await axios.get(`${API_BASE_URL}/machines/${alert.machine_id}`);
                            machineName = machineRes.data.name;
                        } catch (machineErr) {
                            console.warn(`Could not fetch machine name for ID ${alert.machine_id}`);
                        }
                    }
                    return {
                        id: alert.id,
                        timestamp: alert.timestamp,
                        type: 'Alert',
                        machine_id: alert.machine_id,
                        machine_name: machineName,
                        severity: alert.severity,
                        message: alert.message,
                    };
                }));
                const simulatedLogs: LogEntry[] = [
                    {
                        id: 'sys_log_1',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), 
                        type: 'System',
                        message: 'Mise à jour du modèle ML "Détection d\'Anomalies de Température" version 1.2.0.',
                    },
                    {
                        id: 'mach_event_1',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), 
                        type: 'MachineEvent',
                        machine_id: 'VOTRE_UUID_MACHINE_ICI',
                        machine_name: 'Broyeur Alpha',
                        message: 'Maintenance planifiée terminée sur le Broyeur Alpha.',
                    },
                    {
                        id: 'user_action_1',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), 
                        type: 'UserAction',
                        message: 'Utilisateur "Admin" a résolu l\'alerte #4567.',
                    },
                ].filter(log => log.machine_id === 'VOTRE_UUID_MACHINE_ICI' ? false : true); 

                setHistory([...fetchedLogs, ...simulatedLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

            } catch (err) {
                console.error('Failed to fetch history:', err);
                setError('Impossible de charger l\'historique.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000); 
        return () => clearInterval(interval);
    }, []);

    const filteredHistory = history.filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (log.machine_name && log.machine_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (log.type && log.type.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || log.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeColorClass = (type: LogEntry['type']) => {
        switch (type) {
            case 'Alert': return 'bg-red-600';
            case 'DataAnomaly': return 'bg-orange-500';
            case 'MachineEvent': return 'bg-blue-500';
            case 'UserAction': return 'bg-indigo-600';
            case 'System': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    const getSeverityColorClass = (severity?: 'Avertissement' | 'Critique' | 'Urgence') => {
        switch (severity) {
            case 'Urgence': return 'text-red-400';
            case 'Critique': return 'text-orange-400';
            case 'Avertissement': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-gray-100">
            <h1 className="text-3xl font-bold text-indigo-400 mb-6">Historique des Événements</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Rechercher dans l'historique..."
                        className="w-full p-3 pl-10 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="relative">
                    <select
                        className="w-full md:w-auto p-3 pl-10 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 appearance-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Tous les types</option>
                        <option value="Alert">Alertes</option>
                        <option value="DataAnomaly">Anomalies de Données</option>
                        <option value="MachineEvent">Événements Machine</option>
                        <option value="UserAction">Actions Utilisateur</option>
                        <option value="System">Système</option>
                    </select>
                    <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ArrowPathIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <p className="text-center text-lg mt-8">Chargement de l'historique...</p>
            ) : error ? (
                <p className="text-center text-lg text-red-500 mt-8">{error}</p>
            ) : filteredHistory.length === 0 ? (
                <p className="text-center text-lg mt-8 text-gray-400">Aucun événement correspondant à votre recherche ou filtre.</p>
            ) : (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Horodatage
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Machine
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Message
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Sévérité
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredHistory.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-750 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColorClass(entry.type)} text-white`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {entry.machine_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {entry.message}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`font-semibold ${getSeverityColorClass(entry.severity)}`}>
                                            {entry.severity || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}