import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Assurez-vous que vos styles globaux sont importés
import Sidebar from '@/app/components/Sidebar'; // Nous allons créer ce composant
import Header from '@/app/components/Header';   // Nous allons créer ce composant

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prédicteur Pro - Surveillance Industrielle',
  description: 'Application web intelligente de maintenance prédictive pour machines industrielles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Assurez-vous qu'il n'y a PAS d'espace ou de retour à la ligne
    // entre <html> et <body> sur la ligne suivante.
    // Idéalement, <body ...> devrait suivre directement sur la ligne suivante.
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}