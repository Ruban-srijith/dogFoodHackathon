import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './Badge';
import { Button } from './Button';
import { ThemeSelector } from './ThemeSelector';
import { LogOut, Trophy, Shield, User as UserIcon, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[var(--bg-surface)] backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & T-Rex Dinosaur Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              {/* T-Rex Dinosaur Icon (from Screenshot) */}
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3h-4v2h-2v2h-2v2H9v2H7v2H5v2H3v6h2v-2h2v-2h2v4h2v-4h2v2h2v-2h2v-4h2v-2h2V9h-2V7h-2V5h-2V3z"/>
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg tracking-wider text-[var(--text-main)] font-mono">
                  DOGFOOD
                </span>
                <span className="text-[10px] font-mono text-rose-500 font-bold">®</span>
              </div>
            </Link>

            {/* Brutalist Monospace Navigation Links (from Screenshot) */}
            <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono font-bold tracking-widest text-slate-300">
              <Link to="/events" className="hover:text-rose-500 transition">ABOUT</Link>
              <Link to="/events" className="hover:text-rose-500 transition">TIERS</Link>
              <Link to="/events" className="hover:text-rose-500 transition">TIMELINE</Link>
              <Link to="/gallery" className="hover:text-rose-500 transition">GALLERY</Link>
              <Link to="/events" className="hover:text-rose-500 transition">PRIZES</Link>
              <Link to="/events" className="hover:text-rose-500 transition">RULES</Link>
              <Link to="/events" className="hover:text-rose-500 transition">FAQ</Link>
              <Link to="/events" className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">SPEC</Link>
            </div>
          </div>

          {/* Right Actions, Multi-Theme Switcher & Auth State */}
          <div className="flex items-center gap-3">
            {/* Theme Selector Component */}
            <ThemeSelector />

            {/* Quick Action Button (From Screenshot: "GO TO DISCORD" / "REGISTER") */}
            {user ? (
              <div className="hidden md:flex items-center gap-2.5">
                {['JUDGE', 'ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/judge/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Judge Portal
                  </Link>
                )}

                {['ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/organizer/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Organizer
                  </Link>
                )}

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-slate-200">{user.full_name}</span>
                  <RoleBadge role={user.role} />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-500 p-2"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-mono text-xs">
                    SIGN IN
                  </Button>
                </Link>
                {/* Hot Pink / Neon Red CTA Button matching screenshot */}
                <a
                  href="#register"
                  className="px-3.5 py-1.5 rounded-lg bg-[#ff2a5f] hover:bg-[#e0224f] text-white text-xs font-mono font-black tracking-wider uppercase transition shadow-md shadow-rose-500/20"
                >
                  GO TO DISCORD
                </a>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-cyan-500/20 bg-[var(--bg-primary)] px-4 pt-3 pb-6 space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-900/60 border border-slate-800">ABOUT</Link>
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-900/60 border border-slate-800">TIERS</Link>
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-900/60 border border-slate-800">TIMELINE</Link>
            <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-900/60 border border-slate-800">GALLERY</Link>
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-900/60 border border-slate-800">PRIZES</Link>
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-900/60 border border-slate-800">RULES</Link>
          </div>
          <div className="pt-2">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full font-mono text-xs">SIGN IN</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full font-mono text-xs">REGISTER</Button>
                </Link>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={handleLogout} className="w-full font-mono text-xs">SIGN OUT</Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
