'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '@/app/components/Modal'; // Nous allons créer ce composant
import UserForm from '@/app/components/UserForm'; // Nous allons créer ce composant

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrateur' | 'Ingénieur' | 'Technicien';
  status: 'Actif' | 'Inactif';
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('Tous'); // État pour le filtre

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<User[]>(`${API_BASE_URL}/users/`);
      setUsers(response.data);
      setFilteredUsers(response.data); // Initialise avec tous les utilisateurs
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Impossible de charger la liste des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Effet pour filtrer les utilisateurs lorsque le rôle change ou les utilisateurs sont mis à jour
  useEffect(() => {
    if (filterRole === 'Tous') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === filterRole));
    }
  }, [users, filterRole]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      fetchUsers(); // Actualise la liste après suppression
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Erreur lors de la suppression de l\'utilisateur.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    fetchUsers(); // Actualise la liste après ajout/modification
  };

  const getRoleColorClass = (role: string) => {
    switch (role) {
      case 'Administrateur': return 'bg-purple-600';
      case 'Ingénieur': return 'bg-blue-600';
      case 'Technicien': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <p className="text-center text-lg text-gray-300 mt-8">Chargement des utilisateurs...</p>;
  if (error) return <p className="text-center text-lg text-red-500 mt-8">{error}</p>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Gestion des Utilisateurs</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="roleFilter" className="text-gray-300">Rôle :</label>
          <select
            id="roleFilter"
            className="bg-gray-700 text-gray-100 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="Tous">Tous</option>
            <option value="Administrateur">Administrateur</option>
            <option value="Ingénieur">Ingénieur</option>
            <option value="Technicien">Technicien</option>
          </select>

          <button
            onClick={handleAddUser}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Ajouter un utilisateur</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NOM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">EMAIL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">RÔLE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">STATUT</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-750 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-gray-100">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColorClass(user.role)} text-white`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Actif' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-400 hover:text-indigo-600 mx-2 focus:outline-none"
                    title="Modifier"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-600 mx-2 focus:outline-none"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur'}>
        <UserForm user={editingUser} onSubmitSuccess={handleModalClose} />
      </Modal>
    </div>
  );
}