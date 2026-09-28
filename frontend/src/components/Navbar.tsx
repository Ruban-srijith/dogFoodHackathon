import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './Badge';
import { Button } from './Button';
import { ThemeSelector } from './ThemeSelector';
import { LogOut, Trophy, Shield, Users as AdminIcon, User as UserIcon, Menu, X, PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & T-Rex Dinosaur Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] group-hover:border-[var(--border-hover)] flex items-center justify-center text-[var(--accent-cyan)] group-hover:scale-105 transition-transform shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3h-4v2h-2v2h-2v2H9v2H7v2H5v2H3v6h2v-2h2v-2h2v4h2v-4h2v2h2v-2h2v-4h2v-2h2V9h-2V7h-2V5h-2V3z"/>
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg tracking-wider text-[var(--text-main)] font-mono">
                  DOG<span className="text-[var(--accent-red)]">FOOD</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--accent-cyan)] font-bold">®</span>
              </div>
            </Link>

            {/* Functional Monospace Navigation Links */}
            <div className="hidden lg:flex items-center gap-5 text-xs font-mono font-bold tracking-widest text-[var(--text-muted)]">
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `hover:text-[var(--text-main)] transition py-1 ${
                    isActive ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : ''
                  }`
                }
              >
                HACKATHONS
              </NavLink>

              <NavLink
                to="/gallery"
                className={({ isActive }) =>
                  `hover:text-[var(--text-main)] transition py-1 ${
                    isActive ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : ''
                  }`
                }
              >
                PROJECT GALLERY
              </NavLink>

              <NavLink
                to="/judge/dashboard"
                className={({ isActive }) =>
                  `hover:text-[var(--text-main)] transition py-1 ${
                    isActive ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : ''
                  }`
                }
              >
                JUDGING PORTAL
              </NavLink>

              <NavLink
                to="/organizer/dashboard"
                className={({ isActive }) =>
                  `hover:text-[var(--text-main)] transition py-1 ${
                    isActive ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : ''
                  }`
                }
              >
                ORGANIZER CONSOLE
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `hover:text-[var(--text-main)] transition py-1 ${
                    isActive ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]' : ''
                  }`
                }
              >
                ADMIN CONSOLE
              </NavLink>
            </div>
          </div>

          {/* Right Actions, Multi-Theme Switcher & Auth State */}
          <div className="flex items-center gap-3">
            {/* Theme Selector Component */}
            <ThemeSelector />

            {/* User Auth State Actions */}
            {user ? (
              <div className="hidden md:flex items-center gap-2.5">
                {['ADMIN'].includes(user.role) && (
                  <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--accent-red)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
                  >
                    <AdminIcon className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                {['ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/organizer/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--accent-cyan)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Organizer
                  </Link>
                )}

                {['JUDGE', 'ORGANIZER', 'ADMIN'].includes(user.role) && (
                  <Link
                    to="/judge/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--accent-green)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Judge Portal
                  </Link>
                )}

                {user.role === 'PARTICIPANT' && (
                  <Link
                    to="/submissions/new"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--accent-cyan)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Submit Project
                  </Link>
                )}

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono">
                  <UserIcon className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span className="font-bold text-[var(--text-main)] truncate max-w-[120px]">{user.full_name}</span>
                  <RoleBadge role={user.role} />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[var(--text-muted)] hover:text-[var(--accent-red)] p-2"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 font-mono">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-mono text-xs font-bold text-[var(--text-main)]">
                    SIGN IN
                  </Button>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-[var(--accent-red)] hover:brightness-110 text-white text-xs font-mono font-black tracking-wider uppercase transition shadow-md hover:scale-105"
                >
                  REGISTER FOR HACKATHONS
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition border border-[var(--border-color)]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 pt-3 pb-6 space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2 text-[var(--text-main)] font-bold">
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">HACKATHONS</Link>
            <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">PROJECT GALLERY</Link>
            <Link to="/judge/dashboard" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">JUDGE PORTAL</Link>
            <Link to="/organizer/dashboard" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">ORGANIZER CONSOLE</Link>
            <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">ADMIN CONSOLE</Link>
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
