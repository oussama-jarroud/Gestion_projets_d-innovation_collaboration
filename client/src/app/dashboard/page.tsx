'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale 
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

interface GlobalAlert {
    id: string;
    machine_name: string;
    severity: 'Avertissement' | 'Critique' | 'Urgence';
    message: string;
    timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function GlobalDashboardPage() {
    const [globalAlerts, setGlobalAlerts] = useState<GlobalAlert[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);
    const [errorAlerts, setErrorAlerts] = useState<string | null>(null);

    useEffect(() => {
        const fetchGlobalAlerts = async () => {
            setLoadingAlerts(true);
            setErrorAlerts(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/alerts/?resolved=false&limit=10`);
                const alertsWithMachineNames = await Promise.all(response.data.map(async (alert: any) => {
                    const machineRes = await axios.get(`${API_BASE_URL}/machines/${alert.machine_id}`);
                    return {
                        ...alert,
                        machine_name: machineRes.data.name
                    };
                }));
                setGlobalAlerts(alertsWithMachineNames);
            } catch (err) {
                console.error('Failed to fetch global alerts:', err);
                setErrorAlerts('Impossible de charger les alertes globales.');
            } finally {
                setLoadingAlerts(false);
            }
        };

        fetchGlobalAlerts();
        const interval = setInterval(fetchGlobalAlerts, 15000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColorClass = (severity: string) => {
        switch (severity) {
            case 'Urgence': return 'text-red-400';
            case 'Critique': return 'text-orange-400';
            case 'Avertissement': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const globalHealthChartData = {
        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
        datasets: [
            {
                label: 'Machines en Alerte',
                data: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8], 
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Machines en Avertissement',
                data: [5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9], 
                borderColor: 'rgb(255, 205, 86)',
                backgroundColor: 'rgba(255, 205, 86, 0.2)',
                fill: true,
                tension: 0.4,
            }
        ],
    };

    const globalHealthChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#cbd5e1' }
            },
            title: {
                display: true,
                text: 'Évolution des Machines en Alerte (24h)',
                color: '#cbd5e1'
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Heure', color: '#cbd5e1' },
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(100, 100, 100, 0.2)' }
            },
            y: {
                title: { display: true, text: 'Nombre de Machines', color: '#cbd5e1' },
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(100, 100, 100, 0.2)' }
            },
        },
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Widget 1: Statistiques Générales (ex: machines normales, en alerte) */}
            <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Statut Général du Parc</h2>
                <div className="flex justify-around w-full text-center mb-6">
                    <div>
                        <p className="text-5xl font-bold text-green-400">12</p>
                        <p className="text-gray-400">Machines Normales</p>
                    </div>
                    <div>
                        <p className="text-5xl font-bold text-orange-400">3</p>
                        <p className="text-gray-400">Machines en Alerte</p>
                    </div>
                </div>
                <p className="text-sm text-gray-500">Mise à jour il y a 30 secondes</p>
            </div>

            {/* Widget 2: Graphique d'évolution des alertes */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 flex-1 min-h-[300px]">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Santé Globale du Parc Machines</h2>
                <div className="h-[250px] w-full">
                    <Line data={globalHealthChartData} options={globalHealthChartOptions as any} />
                </div>
            </div>

            {/* Widget 3: Alertes Récentes Globales */}
            <div className="lg:col-span-3 bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Alertes Récentes</h2>
                {loadingAlerts ? (
                    <p className="text-center text-gray-400">Chargement des alertes...</p>
                ) : errorAlerts ? (
                    <p className="text-center text-red-500">{errorAlerts}</p>
                ) : globalAlerts.length > 0 ? (
                    <ul className="space-y-3">
                        {globalAlerts.map((alert) => (
                            <li key={alert.id} className="bg-gray-700 p-3 rounded-md border border-gray-600">
                                <div className="flex justify-between items-center text-sm">
                                    <span className={`${getSeverityColorClass(alert.severity)} font-semibold`}>
                                        {alert.severity}
                                    </span>
                                    <span className="text-gray-400">{new Date(alert.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-200 mt-1">
                                    <span className="font-semibold">{alert.machine_name}:</span> {alert.message}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-400">Aucune alerte active détectée sur le parc machines.</p>
                )}
            </div>

            {/* Widget 4: KPIs globaux (simulés) */}
            <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Performance Globale</h2>
                <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-blue-400">98.5%</p>
                    <p className="text-gray-400">Disponibilité Moyenne Équipements</p>
                </div>
                <div className="text-center">
                    <p className="text-4xl font-bold text-purple-400">2.3 M€</p>
                    <p className="text-gray-400">Économies Maintenance (Annuel)</p>
                </div>
            </div>

            {/* Widget 5: Prédiction de pannes à venir (simulé) */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Prédictions de Pannes (À Venir)</h2>
                <ul className="space-y-3">
                    <li className="bg-gray-700 p-3 rounded-md border border-gray-600 flex items-center">
                        <span className="text-red-400 text-xl mr-3">⚠️</span>
                        <div>
                            <p className="font-semibold text-gray-100">Broyeur Alpha (Machine A): Risque Élevé de Défaillance J-11</p>
                            <p className="text-gray-400 text-sm">Probabilité de 85% dans les 7 prochains jours.</p>
                        </div>
                    </li>
                    <li className="bg-gray-700 p-3 rounded-md border border-gray-600 flex items-center">
                        <span className="text-yellow-400 text-xl mr-3">❗</span>
                        <div>
                            <p className="font-semibold text-gray-100">Presse Hydraulique Beta (Machine B): Avertissement de Surchauffe</p>
                            <p className="text-gray-400 text-sm">Surveillance accrue recommandée, risque moyen.</p>
                        </div>
                    </li>
                    <li className="bg-gray-700 p-3 rounded-md border border-gray-600 flex items-center">
                        <span className="text-green-400 text-xl mr-3">✅</span>
                        <div>
                            <p className="font-semibold text-gray-100">Convoyeur Delta (Machine C): Tout est Normal</p>
                            <p className="text-gray-400 text-sm">Aucune anomalie ou risque détecté.</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}