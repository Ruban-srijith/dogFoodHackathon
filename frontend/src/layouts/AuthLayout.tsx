import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#080c14] text-slate-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="mb-6 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-500 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080c14] rounded-[14px] flex items-center justify-center">
              <span className="font-extrabold text-emerald-400 text-xl tracking-tighter">DF</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              DOGFOOD
            </span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold -mt-1">
              Hackathon Core
            </span>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>

      <p className="mt-8 text-center text-xs text-slate-500 relative z-10 font-mono">
        DOGFOOD • Self-Hostable Hackathon Platform Architecture
      </p>
    </div>
  );
};
