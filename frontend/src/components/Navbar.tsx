import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './Badge';
import { Button } from './Button';
import { LogOut, Trophy, Compass, Layers, Shield, User as UserIcon, Menu, X, UserPlus } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c14]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-500 p-[1.5px] transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
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

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/events"
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  isActive('/events')
                    ? 'bg-slate-800/90 text-emerald-400 border border-slate-700/80 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                Hackathons
              </Link>
              <Link
                to="/gallery"
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  isActive('/gallery')
                    ? 'bg-slate-800/90 text-sky-400 border border-slate-700/80 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4 text-sky-400" />
                Project Gallery
              </Link>
            </div>
          </div>

          {/* Right Action / Auth State */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {/* Role Specific Quick Portals */}
                {['JUDGE', 'ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/judge/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Judge Portal
                  </Link>
                )}

                {['ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/organizer/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Organizer
                  </Link>
                )}

                {/* User Pill */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">@{user.username}</span>
                  </div>
                  <RoleBadge role={user.role} />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 p-2"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#080c14]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1">
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                isActive('/events') ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              Hackathons
            </Link>
            <Link
              to="/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                isActive('/gallery') ? 'bg-sky-500/10 text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              Project Gallery
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                {['JUDGE', 'ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/judge/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center text-xs font-semibold py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  >
                    Judge Portal
                  </Link>
                )}
                <Button variant="danger" size="sm" onClick={handleLogout} className="w-full">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
