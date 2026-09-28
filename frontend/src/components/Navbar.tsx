import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './Badge';
import { Button } from './Button';
import { LogOut, Trophy, Compass, Layers, Shield, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
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

            {/* Navigation links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/events"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                Hackathons
              </Link>
              <Link
                to="/gallery"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                Project Gallery
              </Link>
            </div>
          </div>

          {/* Right Action / Auth State */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Role specific quick buttons */}
                {['JUDGE', 'ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/judge/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Judge Portal
                  </Link>
                )}

                {['ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/organizer/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Organizer
                  </Link>
                )}

                {/* User Pill */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
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
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
