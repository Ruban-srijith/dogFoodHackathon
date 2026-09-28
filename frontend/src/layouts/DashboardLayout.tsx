import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export interface DashboardLayoutProps {
  portal: 'judge' | 'organizer' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ portal }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar portal={portal} />
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
