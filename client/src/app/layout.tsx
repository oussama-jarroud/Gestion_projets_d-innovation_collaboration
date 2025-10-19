import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';  

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