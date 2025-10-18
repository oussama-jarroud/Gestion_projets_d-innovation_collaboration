'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';

interface RetrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetrain: (trainingDataPath: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function RetrainModal({ isOpen, onClose, onRetrain, isLoading, error }: RetrainModalProps) {
  const [trainingDataPath, setTrainingDataPath] = useState<string>(''); // Chemin vers les nouvelles données

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRetrain(trainingDataPath);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-100 flex justify-between items-center mb-4">
                  Ré-entraîner le Modèle
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-100 transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-gray-300 mb-4">
                    Entrez le chemin vers le nouveau jeu de données d'entraînement pour ré-entraîner ce modèle.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="trainingDataPath" className="block text-sm font-medium text-gray-200 mb-1">
                        Chemin des données d'entraînement:
                      </label>
                      <input
                        type="text"
                        id="trainingDataPath"
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={trainingDataPath}
                        onChange={(e) => setTrainingDataPath(e.target.value)}
                        placeholder="/data/new_training_set.csv"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {error && (
                      <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Ré-entraînement en cours...
                            </>
                        ) : (
                            <>
                                <PlayIcon className="h-5 w-5 mr-2" /> Lancer le Ré-entraînement
                            </>
                        )}
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