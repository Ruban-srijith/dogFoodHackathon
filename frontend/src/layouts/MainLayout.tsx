import React from 'react';
import { Outlet } from 'react-router-dom';
import { Marquee } from '../components/Marquee';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300">
      {/* Top Running Marquee Banner */}
      <Marquee />
      {/* Sticky Navigation Header */}
      <Navbar />
      {/* Main Page Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <Outlet />
      </main>
      {/* Footer */}
      <Footer />
    </div>
  );
};
