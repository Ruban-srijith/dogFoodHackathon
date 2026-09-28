import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Relief } from '../components/Relief';
import { Cursor } from '../components/Cursor';
import { FixedUI } from '../components/FixedUI';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--bg-primary)] text-[var(--text-main)] relative overflow-hidden transition-colors duration-300">
      {/* Precision Cursor */}
      <Cursor />

      {/* WebGL 3D Interactive Relief Shader Background */}
      <Relief />

      {/* Persistent Fixed UI (Theme Selector, Menu, Progress Ring) */}
      <FixedUI />

      {/* Ambient theme grid overlay */}
      <div className="absolute inset-0 blueprint-grid-overlay pointer-events-none opacity-40 z-0" />

      <div className="mb-6 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[var(--border-color)] p-[1.5px] shadow-lg group-hover:scale-105 transition-transform border border-[var(--border-hover)]">
            <div className="w-full h-full bg-[var(--bg-surface)] rounded-[14px] flex items-center justify-center">
              <span className="font-extrabold text-[var(--accent-cyan)] text-xl tracking-tighter">DF</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tight text-[var(--text-main)] font-mono">
              DOG<span className="text-[var(--accent-red)]">FOOD</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--accent-cyan)] font-mono font-bold -mt-1">
              Hackathon Core Engine
            </span>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)] relative z-10 font-mono">
        DOGFOOD • Self-Hostable Hackathon Platform Architecture
      </p>
    </div>
  );
};

