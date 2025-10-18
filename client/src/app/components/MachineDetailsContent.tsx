'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'; // Pour les alertes

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

interface Machine {
  id: string;
  name: string;
  location?: string;
  type?: string;
  serial_number?: string;
  thresholds_config?: { [key: string]: any };
}

interface SensorDataPoint {
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  current: number;
  operating_hours?: number;
  labels?: string[];
}

interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: 'Avertissement' | 'Critique' | 'Urgence';
  message: string;
  is_resolved: boolean;
}

interface MachineDetailsContentProps {
  machine: Machine;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function MachineDetailsContent({ machine }: MachineDetailsContentProps) {
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [errorAlerts, setErrorAlerts] = useState<string | null>(null);

  const maxSeverity = useMemo(() => {
    const activeAlerts = alerts.filter(alert => !alert.is_resolved);
    if (activeAlerts.some(alert => alert.severity === 'Urgence')) return 'Urgence';
    if (activeAlerts.some(alert => alert.severity === 'Critique')) return 'Critique';
    if (activeAlerts.some(alert => alert.severity === 'Avertissement')) return 'Avertissement';
    return 'Normal';
  }, [alerts]);

  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case 'Urgence': return 'bg-red-600 text-white';
      case 'Critique': return 'bg-orange-500 text-white';
      case 'Avertissement': return 'bg-yellow-500 text-gray-900';
      case 'Normal': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSeverityTextColorClass = (severity: string) => {
    switch (severity) {
      case 'Urgence': return 'text-red-400';
      case 'Critique': return 'text-orange-400';
      case 'Avertissement': return 'text-yellow-400';
      case 'Normal': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  useEffect(() => {
    if (!machine || !machine.id) return;

    const fetchSensorData = async () => {
      setLoadingData(true);
      setErrorData(null);
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const response = await axios.get<SensorDataPoint[]>(
          `${API_BASE_URL}/machines/${machine.id}/sensor-data/`,
          { params: { start_time: oneDayAgo, limit: 500 } }
        );
        setSensorData(response.data);
      } catch (err) {
        console.error('Failed to fetch sensor data:', err);
        setErrorData('Impossible de charger les données des capteurs.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, [machine]);

  useEffect(() => {
    if (!machine || !machine.id) return;

    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      setErrorAlerts(null);
      try {
        const response = await axios.get<Alert[]>(`${API_BASE_URL}/machines/${machine.id}/alerts/`);
        setAlerts(response.data.filter(alert => !alert.is_resolved));
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setErrorAlerts('Impossible de charger les alertes.');
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [machine]);

  const chartData = {
    labels: sensorData.map(data => new Date(data.timestamp)),
    datasets: [
      {
        label: 'Température (°C)',
        data: sensorData.map(data => data.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Rend le remplissage un peu transparent
        yAxisID: 'y',
        tension: 0.3, // Ajoute un peu de courbe
        pointRadius: 0 // Masque les points individuels
      },
      {
        label: 'Vibration',
        data: sensorData.map(data => data.vibration),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: 'Pression',
        data: sensorData.map(data => data.pressure),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y2',
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: 'Courant',
        data: sensorData.map(data => data.current),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        yAxisID: 'y3',
        tension: 0.3,
        pointRadius: 0
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute',
          tooltipFormat: 'dd/MM/yyyy HH:mm:ss',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'dd/MM'
          }
        },
        title: { display: true, text: 'Heure', color: '#cbd5e1' }, // Couleur du texte
        ticks: { color: '#94a3b8' }, // Couleur des graduations
        grid: { color: 'rgba(100, 100, 100, 0.2)' } // Couleur de la grille
      },
      y: { type: 'linear' as const, display: true, position: 'left' as const, title: { display: true, text: 'Température', color: '#cbd5e1' }, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(100, 100, 100, 0.2)' } },
      y1: { type: 'linear' as const, display: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Vibration', color: '#cbd5e1' }, ticks: { color: '#94a3b8' } },
      y2: { type: 'linear' as const, display: false, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Pression', color: '#cbd5e1' }, ticks: { color: '#94a3b8' } },
      y3: { type: 'linear' as const, display: false, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Courant', color: '#cbd5e1' }, ticks: { color: '#94a3b8' } }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#cbd5e1' } // Couleur du texte de la légende
      },
      title: {
        display: true,
        text: `Données de Capteurs pour ${machine.name}`,
        color: '#cbd5e1' // Couleur du titre du graphique
      },
    },
  };

  return (
    <>
      {/* Section d'état global de la machine et informations clés */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">
            État de la Machine: <span className={getSeverityTextColorClass(maxSeverity)}>{machine.name}</span>
          </h2>
          <p className="text-gray-400 mt-1">
            Type: {machine.type} | Localisation: {machine.location} | Série: {machine.serial_number}
          </p>
        </div>
        <span className={`px-4 py-2 text-md font-semibold rounded-full ${getSeverityColorClass(maxSeverity)}`}>
          {maxSeverity === 'Normal' ? 'Normal' : `Alerte: ${maxSeverity}`}
        </span>
      </div>

      {/* Graphique des données de capteurs */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex-1 min-h-[400px]">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Données des Capteurs en Temps Réel</h3>
        <div className="h-[300px] w-full">
          {loadingData ? (
            <p className="text-center mt-20 text-lg text-gray-400">Chargement des données capteurs...</p>
          ) : errorData ? (
            <p className="text-center mt-20 text-lg text-red-500">{errorData}</p>
          ) : sensorData.length > 0 ? (
            <Line data={chartData} options={chartOptions as any} />
          ) : (
            <p className="text-center mt-20 text-lg text-gray-400">Pas encore de données de capteurs pour cette machine.</p>
          )}
        </div>
      </div>

      {/* Section des Alertes */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-100 flex items-center">
          <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
          Alertes Critiques
        </h3>
        {loadingAlerts ? (
          <p className="text-center mt-4 text-gray-400">Chargement des alertes...</p>
        ) : errorAlerts ? (
          <p className="text-center text-red-500 mt-4">{errorAlerts}</p>
        ) : alerts.length > 0 ? (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="border border-gray-700 p-3 rounded-md bg-gray-700">
                <div className="flex justify-between items-center">
                    <span className={`font-semibold ${getSeverityTextColorClass(alert.severity)}`}>
                        {alert.severity}: {alert.type}
                    </span>
                    <span className="text-sm text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                    </span>
                </div>
                <p className="text-gray-300 mt-1 text-sm">{alert.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-400">Aucune alerte active pour cette machine.</p>
        )}
      </div>
    </>
  );
}