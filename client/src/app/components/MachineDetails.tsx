'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Ajout de useMemo
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

interface Machine {
  id: string;
  name: string;
  location?: string;
  type?: string;
  thresholds_config?: { [key: string]: any }; // Pour afficher les seuils
  serial_number?: string;
}

interface SensorDataPoint {
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  current: number;
  operating_hours?: number;
  labels?: string[]; // Ajout des labels pour le ML
}

interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: 'Avertissement' | 'Critique' | 'Urgence';
  message: string;
  is_resolved: boolean;
}

interface MachineDetailsProps {
  machine: Machine;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function MachineDetails({ machine }: MachineDetailsProps) {
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]); // Nouvel état pour les alertes
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [errorAlerts, setErrorAlerts] = useState<string | null>(null);

  // Déterminer la sévérité maximale des alertes actives
  const maxSeverity = useMemo(() => {
    const activeAlerts = alerts.filter(alert => !alert.is_resolved);
    if (activeAlerts.some(alert => alert.severity === 'Urgence')) return 'Urgence';
    if (activeAlerts.some(alert => alert.severity === 'Critique')) return 'Critique';
    if (activeAlerts.some(alert => alert.severity === 'Avertissement')) return 'Avertissement';
    return 'Normal';
  }, [alerts]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Urgence': return 'bg-red-500';
      case 'Critique': return 'bg-orange-500';
      case 'Avertissement': return 'bg-yellow-500';
      case 'Normal': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'Urgence': return 'text-red-500';
      case 'Critique': return 'text-orange-500';
      case 'Avertissement': return 'text-yellow-500';
      case 'Normal': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };


  // Effet pour récupérer les données de capteurs
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
    const interval = setInterval(fetchSensorData, 10000); // Poll toutes les 10 secondes
    return () => clearInterval(interval);
  }, [machine]);

  // Effet pour récupérer les alertes
  useEffect(() => {
    if (!machine || !machine.id) return;

    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      setErrorAlerts(null);
      try {
        const response = await axios.get<Alert[]>(`${API_BASE_URL}/machines/${machine.id}/alerts/`);
        setAlerts(response.data.filter(alert => !alert.is_resolved)); // N'affiche que les alertes non résolues
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setErrorAlerts('Impossible de charger les alertes.');
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Poll toutes les 10 secondes
    return () => clearInterval(interval);
  }, [machine]);


  // Configuration du graphique Chart.js
  const chartData = {
    labels: sensorData.map(data => new Date(data.timestamp)),
    datasets: [
      {
        label: 'Température (°C)',
        data: sensorData.map(data => data.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Vibration',
        data: sensorData.map(data => data.vibration),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y1',
      },
      {
        label: 'Pression',
        data: sensorData.map(data => data.pressure),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y2',
      },
      {
        label: 'Courant',
        data: sensorData.map(data => data.current),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        yAxisID: 'y3',
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
        title: { display: true, text: 'Heure' }
      },
      y: { type: 'linear' as const, display: true, position: 'left' as const, title: { display: true, text: 'Température' } },
      y1: { type: 'linear' as const, display: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Vibration' } },
      y2: { type: 'linear' as const, display: false, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Pression' } },
      y3: { type: 'linear' as const, display: false, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Courant' } }
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Données de Capteurs pour ${machine.name}` },
    },
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 text-indigo-700 dark:text-indigo-400">
        {machine.name}
        <span className={`ml-4 px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(maxSeverity)} text-white`}>
          {maxSeverity === 'Normal' ? 'Statut Normal' : `Alerte: ${maxSeverity}`}
        </span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Informations Clés</h3>
          <p className="text-gray-600 dark:text-gray-300">**Type:** {machine.type}</p>
          <p className="text-gray-600 dark:text-gray-300">**Localisation:** {machine.location}</p>
          <p className="text-gray-600 dark:text-gray-300">**Numéro de Série:** {machine.serial_number}</p>
          {machine.thresholds_config && Object.keys(machine.thresholds_config).length > 0 && (
              <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-200">Seuils Configurés:</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                      {Object.entries(machine.thresholds_config).map(([key, value]) => (
                          <li key={key}>{key}: {value}</li>
                      ))}
                  </ul>
              </div>
          )}
        </div>
        {/* Nouveau panneau pour les KPIs (sera enrichi plus tard) */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex flex-col justify-center items-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Indicateurs Clés (KPIs)</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-lg">
                **Probabilité de Panne (24h):** <span className="font-bold text-green-500">Faible (5%)</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-center text-lg mt-2">
                **Coût Maintenance Réduit (Mois):** <span className="font-bold text-indigo-500">~15%</span>
            </p>
        </div>
      </div>

      <div className="h-96 w-full mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        {loadingData ? (
          <p className="text-center mt-20 text-lg text-gray-600 dark:text-gray-400">Chargement des données capteurs...</p>
        ) : errorData ? (
          <p className="text-center mt-20 text-lg text-red-500">{errorData}</p>
        ) : sensorData.length > 0 ? (
          <Line data={chartData} options={chartOptions as any} />
        ) : (
          <p className="text-center mt-20 text-lg text-gray-600 dark:text-gray-400">Pas encore de données de capteurs pour cette machine.</p>
        )}
      </div>

      {/* Section pour les Alertes */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex justify-between items-center">
            Alertes Actives
            <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getSeverityColor(maxSeverity)} text-white`}>
                {alerts.length} alerte(s)
            </span>
        </h3>
        {loadingAlerts ? (
          <p className="text-center mt-4">Chargement des alertes...</p>
        ) : errorAlerts ? (
          <p className="text-center text-red-500 mt-4">{errorAlerts}</p>
        ) : alerts.length > 0 ? (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="border border-gray-200 dark:border-gray-700 p-3 rounded-md bg-white dark:bg-gray-750">
                <div className="flex justify-between items-center">
                    <span className={`font-semibold ${getSeverityTextColor(alert.severity)}`}>
                        {alert.severity}: {alert.type}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                    </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm">{alert.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">Aucune alerte active pour cette machine.</p>
        )}
      </div>
    </div>
  );
}