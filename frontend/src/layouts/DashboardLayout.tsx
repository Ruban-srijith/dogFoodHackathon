import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Relief } from '../components/Relief';
import { Cursor } from '../components/Cursor';
import { Footer } from '../components/Footer';

export interface DashboardLayoutProps {
  portal: 'judge' | 'organizer' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ portal }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying session credentials...</span>
        </div>
      </div>
    );
  }

  // If user is logged out, immediately revoke access and redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role authorization per portal
  const isAuthorized =
    portal === 'admin'
      ? user.role === 'ADMIN'
      : portal === 'organizer'
      ? user.role === 'ORGANIZER' || user.role === 'ADMIN'
      : portal === 'judge'
      ? user.role === 'JUDGE' || user.role === 'ADMIN'
      : false;

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300 relative selection:bg-rose-500/30 selection:text-white">
      {/* Precision Cursor */}
      <Cursor />

      {/* WebGL 3D Interactive Relief Shader Background */}
      <Relief />

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
