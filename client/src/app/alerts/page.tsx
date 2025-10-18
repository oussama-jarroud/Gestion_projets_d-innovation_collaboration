'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BellAlertIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Icônes

interface Alert {
  id: string;
  machine_id: string;
  machine_name?: string; // Ajouté pour l'affichage
  timestamp: string;
  type: string;
  severity: 'Avertissement' | 'Critique' | 'Urgence';
  message: string;
  is_resolved: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResolved, setFilterResolved] = useState<string>('false'); // 'true', 'false', 'all'

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}/alerts/`;
        if (filterResolved !== 'all') {
          url += `?resolved=${filterResolved}`;
        }

        const response = await axios.get<Alert[]>(url);

        // Fetch machine names for each alert
        const alertsWithMachineNames = await Promise.all(response.data.map(async (alert) => {
          try {
            const machineResponse = await axios.get(`${API_BASE_URL}/machines/${alert.machine_id}`);
            return { ...alert, machine_name: machineResponse.data.name };
          } catch (machineError) {
            console.error(`Failed to fetch machine for alert ${alert.id}:`, machineError);
            return { ...alert, machine_name: 'Inconnu' }; // Fallback
          }
        }));

        setAlerts(alertsWithMachineNames);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setError('Impossible de charger les alertes.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Refresh toutes les 15 secondes
    return () => clearInterval(interval);
  }, [filterResolved]);

  const handleResolveAlert = async (id: string) => {
    try {
      await axios.put(`${API_BASE_URL}/alerts/${id}/resolve`);
      setAlerts(prevAlerts => prevAlerts.map(alert =>
        alert.id === id ? { ...alert, is_resolved: true } : alert
      ));
    } catch (err) {
      console.error(`Failed to resolve alert ${id}:`, err);
      alert('Erreur lors de la résolution de l\'alerte.');
    }
  };

  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case 'Urgence': return 'text-red-400';
      case 'Critique': return 'text-orange-400';
      case 'Avertissement': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityBgClass = (severity: string) => {
    switch (severity) {
      case 'Urgence': return 'bg-red-900';
      case 'Critique': return 'bg-orange-900';
      case 'Avertissement': return 'bg-yellow-900';
      default: return 'bg-gray-700';
    }
  };


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-100 mb-6 flex items-center">
        <BellAlertIcon className="h-8 w-8 text-indigo-400 mr-3" />
        Gestion des Alertes
      </h1>

      <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6 flex justify-end space-x-4">
        <label htmlFor="filterResolved" className="text-gray-300 flex items-center">
          Afficher :
        </label>
        <select
          id="filterResolved"
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-gray-100 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="false">Actives</option>
          <option value="true">Résolues</option>
          <option value="all">Toutes</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        {loading ? (
          <p className="text-center text-gray-400 text-lg">Chargement des alertes...</p>
        ) : error ? (
          <p className="text-center text-red-500 text-lg">{error}</p>
        ) : alerts.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">Aucune alerte à afficher selon les filtres.</p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`${getSeverityBgClass(alert.severity)} p-4 rounded-lg flex items-center justify-between transition-all duration-200 ease-in-out`}>
                <div className="flex items-center">
                  {alert.severity === 'Urgence' && <XCircleIcon className="h-8 w-8 text-red-300 mr-3" />}
                  {alert.severity === 'Critique' && <ExclamationTriangleIcon className="h-8 w-8 text-orange-300 mr-3" />}
                  {alert.severity === 'Avertissement' && <BellAlertIcon className="h-8 w-8 text-yellow-300 mr-3" />}
                  <div className="ml-2">
                    <p className={`font-bold ${getSeverityColorClass(alert.severity)} text-lg`}>
                      {alert.severity} - {alert.type} sur {alert.machine_name || 'Machine Inconnue'}
                    </p>
                    <p className="text-gray-200 mt-1">{alert.message}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Détectée le: {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!alert.is_resolved ? (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Résoudre
                  </button>
                ) : (
                  <span className="flex items-center text-green-400 font-semibold">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Résolue
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}