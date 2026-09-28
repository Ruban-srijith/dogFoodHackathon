import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Relief } from '../components/Relief';
import { Cursor } from '../components/Cursor';
import { FixedUI } from '../components/FixedUI';
import { Footer } from '../components/Footer';

export interface DashboardLayoutProps {
  portal: 'judge' | 'organizer' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ portal }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300 relative selection:bg-rose-500/30 selection:text-white">
      {/* Precision Cursor */}
      <Cursor />

      {/* WebGL 3D Interactive Relief Shader Background */}
      <Relief />

      {/* Persistent Fixed UI Overlay (Theme Selector, Menu Overlay, Progress Ring) */}
      <FixedUI />

      {/* Blueprint Grid Ambient Pattern */}
      <div className="absolute inset-0 blueprint-grid-overlay pointer-events-none opacity-30 z-0" />

      {/* Sticky Top Navigation Header */}
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto relative z-10">
        <Sidebar portal={portal} />
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden relative z-10">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

