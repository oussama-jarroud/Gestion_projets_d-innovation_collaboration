'use client';

import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface MLModel {
    id: string;
    name: string;
    algorithm: string;
    version: string;
    status: 'Actif' | 'Inactif' | 'Entraînement' | 'Erreur';
    last_trained: string; // ISO string
    performance_score?: number; // F1-score, Accuracy, etc.
    deployed_machines_count?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function MLModelsPage() {
    const [models, setModels] = useState<MLModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMLModels = async () => {
            setLoading(true);
            setError(null);
            try {
                // Simuler des modèles pour le moment, car l'API backend n'a pas encore d'endpoints pour les modèles ML spécifiques
                const simulatedModels: MLModel[] = [
                    {
                        id: "model_1",
                        name: "Détection d'Anomalies de Température",
                        algorithm: "Random Forest",
                        version: "1.2.0",
                        status: "Actif",
                        last_trained: "2023-10-26T10:00:00Z",
                        performance_score: 0.92,
                        deployed_machines_count: 5
                    },
                    {
                        id: "model_2",
                        name: "Prédiction de Défaillance Vibratoire",
                        algorithm: "XGBoost",
                        version: "2.1.0",
                        status: "Actif",
                        last_trained: "2023-10-25T14:30:00Z",
                        performance_score: 0.88,
                        deployed_machines_count: 3
                    },
                    {
                        id: "model_3",
                        name: "Prédiction de Durée de Vie Restante (RUL)",
                        algorithm: "LSTM Network",
                        version: "1.0.0",
                        status: "Entraînement",
                        last_trained: "2023-10-27T08:15:00Z",
                        performance_score: undefined,
                        deployed_machines_count: 0
                    },
                    {
                        id: "model_4",
                        name: "Détection de Surchauffe Moteur",
                        algorithm: "Isolation Forest",
                        version: "1.1.0",
                        status: "Erreur",
                        last_trained: "2023-10-24T11:00:00Z",
                        performance_score: 0.75,
                        deployed_machines_count: 2
                    }
                ];
                setModels(simulatedModels);

                // Quand vous aurez un endpoint API pour les modèles ML:
                // const response = await axios.get<MLModel[]>(`${API_BASE_URL}/ml-models`);
                // setModels(response.data);

            } catch (err) {
                console.error('Failed to fetch ML models:', err);
                setError('Impossible de charger la liste des modèles ML.');
            } finally {
                setLoading(false);
            }
        };

        fetchMLModels();
        // Peut-être rafraîchir toutes les 30 secondes pour les statuts d'entraînement
        const interval = setInterval(fetchMLModels, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColorClass = (status: MLModel['status']) => {
        switch (status) {
            case 'Actif': return 'bg-green-600';
            case 'Inactif': return 'bg-gray-500';
            case 'Entraînement': return 'bg-blue-500';
            case 'Erreur': return 'bg-red-600';
            default: return 'bg-gray-400';
        }
    };

    const getStatusIcon = (status: MLModel['status']) => {
        switch (status) {
            case 'Actif': return <CheckCircleIcon className="h-5 w-5 text-white" />;
            case 'Inactif': return <ClockIcon className="h-5 w-5 text-white" />;
            case 'Entraînement': return <Cog6ToothIcon className="h-5 w-5 text-white animate-spin" />;
            case 'Erreur': return <ExclamationTriangleIcon className="h-5 w-5 text-white" />;
            default: return <Cog6ToothIcon className="h-5 w-5 text-white" />;
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-gray-100">
            <h1 className="text-3xl font-bold text-indigo-400 mb-6">Gestion des Modèles de Machine Learning</h1>

            {loading ? (
                <p className="text-center text-lg mt-8">Chargement des modèles ML...</p>
            ) : error ? (
                <p className="text-center text-lg text-red-500 mt-8">{error}</p>
            ) : models.length === 0 ? (
                <p className="text-center text-lg mt-8 text-gray-400">Aucun modèle ML enregistré pour le moment.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map((model) => (
                        <div key={model.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between border border-gray-700 hover:border-indigo-600 transition-colors duration-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-100 mb-2">{model.name}</h2>
                                <p className="text-gray-400 text-sm mb-1">**Algorithme:** {model.algorithm}</p>
                                <p className="text-gray-400 text-sm mb-1">**Version:** {model.version}</p>
                                <p className="text-gray-400 text-sm mb-3">**Dernier entraînement:** {new Date(model.last_trained).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusColorClass(model.status)} text-white`}>
                                    {getStatusIcon(model.status)} {model.status}
                                </span>
                                {model.performance_score && (
                                    <span className="text-sm text-gray-300">
                                        Score: <span className="font-bold text-indigo-300">{(model.performance_score * 100).toFixed(1)}%</span>
                                    </span>
                                )}
                            </div>
                            {model.deployed_machines_count !== undefined && (
                                <p className="text-xs text-gray-500 mt-2">Déployé sur {model.deployed_machines_count} machine(s).</p>
                            )}
                            <div className="mt-4 flex justify-end space-x-2">
                                <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors duration-200">
                                    Voir Détails
                                </button>
                                <button className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600 transition-colors duration-200">
                                    Ré-entraîner
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}