import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Terminal, GitCommit, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060910] pt-12 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-500 p-[1.5px] transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <span className="font-extrabold text-emerald-400 text-lg tracking-tighter">DF</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  DOGFOOD
                </span>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold -mt-1">
                  Hackathon Core
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Self-hostable, Dockerized hackathon management platform with server-side judge isolation, weighted rubric evaluations, and live project galleries.
            </p>
            <div className="flex items-center gap-3 text-xs font-mono text-emerald-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                System Online v1.0.0
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Docker Isolated
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/events" className="hover:text-emerald-400 transition-colors">
                  Browse Hackathons
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-emerald-400 transition-colors">
                  Public Project Gallery
                </Link>
              </li>
              <li>
                <Link to="/teams/join" className="hover:text-emerald-400 transition-colors">
                  Join Team via Invite
                </Link>
              </li>
              <li>
                <Link to="/submissions/new" className="hover:text-emerald-400 transition-colors">
                  Submit Project Entry
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">Infrastructure</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> TypeScript / React / Vite
              </li>
              <li className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Express Node.js Engine
              </li>
              <li className="flex items-center gap-2">
                <GitCommit className="w-3.5 h-3.5 text-indigo-400" /> PostgreSQL & Migrations
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} DOGFOOD Platform. 100% Open Source Architecture.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-0.5" /> for Hackathon Builders
          </div>
        </div>
      </div>
    </footer>
  );
};
