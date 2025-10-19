import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  Cog6ToothIcon,
  MicrophoneIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface MLModel {
  id: string;
  name: string;
  algorithm: string;
  version: string;
  status: 'Actif' | 'Inactif' | 'Entraînement' | 'Erreur';
  last_trained: string; 
  performance_score?: number;
  deployed_machines_count?: number;
  training_logs?: string[];
  evaluation_metrics?: { [key: string]: number };
  hyperparameters?: { [key: string]: any };
  feature_importance?: { [key: string]: number };
}

interface MLModelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: MLModel | null;
  onRetrain: (modelId: string) => void;
}

export default function MLModelDetailsModal({ isOpen, onClose, model, onRetrain }: MLModelDetailsModalProps) {
  if (!model) return null;

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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-100 flex items-center justify-between">
                  <span>Détails du Modèle : {model.name}</span>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-700 px-2 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <div className="mt-6 text-gray-300 space-y-4">
                  <p>
                    <strong className="text-indigo-400">ID:</strong> {model.id}
                  </p>
                  <p>
                    <strong className="text-indigo-400">Algorithme:</strong> {model.algorithm}
                  </p>
                  <p>
                    <strong className="text-indigo-400">Version:</strong> {model.version}
                  </p>
                  <p>
                    <strong className="text-indigo-400">Dernier Entraînement:</strong>{' '}
                    {new Date(model.last_trained).toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-2">
                    <strong className="text-indigo-400">Statut:</strong>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusColorClass(model.status)} text-white`}>
                      {getStatusIcon(model.status)} {model.status}
                    </span>
                  </div>
                  {model.performance_score && (
                    <p>
                      <strong className="text-indigo-400">Score de Performance:</strong>{' '}
                      <span className="font-bold text-green-400">{(model.performance_score * 100).toFixed(1)}%</span>
                    </p>
                  )}
                  {model.deployed_machines_count !== undefined && (
                    <p>
                      <strong className="text-indigo-400">Déployé sur:</strong> {model.deployed_machines_count} machine(s)
                    </p>
                  )}

                  {/* Plus de détails optionnels */}
                  {model.evaluation_metrics && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-200 mt-4">Métriques d'Évaluation:</h4>
                      <ul className="list-disc list-inside ml-4">
                        {Object.entries(model.evaluation_metrics).map(([key, value]) => (
                          <li key={key} className="text-gray-400">
                            {key}: <span className="font-mono">{value.toFixed(4)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {model.hyperparameters && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-200 mt-4">Hyperparamètres:</h4>
                      <ul className="list-disc list-inside ml-4">
                        {Object.entries(model.hyperparameters).map(([key, value]) => (
                          <li key={key} className="text-gray-400">
                            {key}: <span className="font-mono">{JSON.stringify(value)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {model.training_logs && model.training_logs.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-200 mt-4">Journaux d'Entraînement Récents:</h4>
                      <div className="bg-gray-900 p-3 rounded-md text-sm font-mono text-gray-400 max-h-40 overflow-y-auto custom-scrollbar">
                        {model.training_logs.map((log, index) => (
                          <p key={index}>{log}</p>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={() => {
                        onRetrain(model.id);
                        onClose(); // Ferme la modale après avoir déclenché le ré-entraînement
                    }}
                    disabled={model.status === 'Entraînement'} // Désactiver si déjà en entraînement
                  >
                    Ré-entraîner
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}