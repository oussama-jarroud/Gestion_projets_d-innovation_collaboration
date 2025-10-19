'use client';

import React from 'react';
import Link from 'next/link';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import {
  Cog6ToothIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon,
  UserGroupIcon,
  QueueListIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Machines', href: '/', icon: QueueListIcon }, 
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarSquareIcon }, 
  { name: 'ML Modèles', href: '/ml-models', icon: Cog6ToothIcon },
  { name: 'Alertes', href: '/alerts', icon: BellAlertIcon },
  { name: 'Historique', href: '/history', icon: ClipboardDocumentListIcon },
  { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon },
  { name: 'Utilisateurs', href: '/users', icon: UserGroupIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 bg-gray-800 dark:bg-gray-800 text-gray-300 dark:text-gray-300 flex flex-col py-6 border-r border-gray-700">
      <div className="flex items-center justify-center mb-10">
        {/* Logo ou icône de l'application */}
        <SparklesIcon className="h-10 w-10 text-indigo-400" />
      </div>
      <nav className="flex-1 space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center p-2 rounded-lg mx-3 transition-colors duration-200
              ${pathname === item.href ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 hover:text-white'}`}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}