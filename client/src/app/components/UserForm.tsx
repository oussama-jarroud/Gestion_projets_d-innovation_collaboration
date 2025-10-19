'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrateur' | 'Ingénieur' | 'Technicien';
  status: 'Actif' | 'Inactif';
  created_at: string;
  updated_at: string;
}

interface UserFormProps {
  user: User | null; 
  onSubmitSuccess: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function UserForm({ user, onSubmitSuccess }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Administrateur' | 'Ingénieur' | 'Technicien'>('Technicien');
  const [status, setStatus] = useState<'Actif' | 'Inactif'>('Actif');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
    } else {
      setName('');
      setEmail('');
      setRole('Technicien');
      setStatus('Actif');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const userData = { name, email, role, status };
      if (user) {
        await axios.put(`${API_BASE_URL}/users/${user.id}`, userData);
        alert('Utilisateur modifié avec succès !');
      } else {
        await axios.post(`${API_BASE_URL}/users/`, userData);
        alert('Utilisateur ajouté avec succès !');
      }
      onSubmitSuccess();
    } catch (err: any) {
      console.error('Erreur lors de la soumission du formulaire :', err);
      setSubmitError(err.response?.data?.detail || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nom</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-300">Rôle</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'Administrateur' | 'Ingénieur' | 'Technicien')}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="Administrateur">Administrateur</option>
          <option value="Ingénieur">Ingénieur</option>
          <option value="Technicien">Technicien</option>
        </select>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-300">Statut</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'Actif' | 'Inactif')}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="Actif">Actif</option>
          <option value="Inactif">Inactif</option>
        </select>
      </div>
      {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition-colors duration-200"
          disabled={loading}
        >
          {loading ? 'Envoi...' : (user ? 'Modifier l\'utilisateur' : 'Ajouter l\'utilisateur')}
        </button>
      </div>
    </form>
  );
}