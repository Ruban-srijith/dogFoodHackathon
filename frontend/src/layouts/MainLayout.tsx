import React from 'react';
import { Outlet } from 'react-router-dom';
import { Marquee } from '../components/Marquee';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Relief } from '../components/Relief';
import { Cursor } from '../components/Cursor';
import { SmoothScroll } from '../components/SmoothScroll';

export const MainLayout: React.FC = () => {
  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300 relative selection:bg-rose-500/30 selection:text-white">
        {/* Desktop Precision Dot & Trailing Lerp Cursor */}
        <Cursor />
        
        {/* Background Image with Dark Slate Overlay */}
        <Relief />

        {/* Top Running Marquee Banner */}
        <Marquee />

        {/* Sticky Navigation Header */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </SmoothScroll>
  );
};
