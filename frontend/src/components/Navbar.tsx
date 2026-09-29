import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { NavigationDrawer } from './NavigationDrawer';
import { RoleBadge } from './Badge';
import { Button } from './Button';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleNav } = useNavigation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Section: Burger on the far left for all roles + Brand & T-Rex Logo + Quick Links */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              
              {/* Burger Menu Button on the LEFT for ALL roles */}
              <button
                id="navbar-burger-left"
                onClick={toggleNav}
                className="p-2 -ml-2 rounded-xl text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B] border border-transparent hover:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] transition cursor-pointer flex items-center justify-center group"
                aria-label="Toggle Navigation Bar"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-[#E2E8F0] group-hover:text-[#A78BFA] transition-colors" />
              </button>

              {/* Brand & T-Rex Dinosaur Logo */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 flex items-center justify-center text-[var(--accent-red)] group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3h-4v2h-2v2h-2v2H9v2H7v2H5v2H3v6h2v-2h2v-2h2v4h2v-4h2v2h2v-2h2v-4h2v-2h2V9h-2V7h-2V5h-2V3z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-lg tracking-wider text-[var(--text-main)] font-mono">
                    DOGFOOD
                  </span>
                  <span className="text-[10px] font-mono text-[var(--accent-red)] font-bold">®</span>
                </div>
              </Link>

              {/* Brutalist Monospace Navigation Links */}
              <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono font-bold tracking-widest text-[var(--text-muted)]">
                <a href="/#about" className="hover:text-[var(--accent-red)] transition">ABOUT</a>
                <Link to="/events" className="hover:text-[var(--accent-red)] transition">HACKATHONS</Link>
                <Link to="/gallery" className="hover:text-[var(--accent-red)] transition">GALLERY</Link>
                <Link to="/teams/join" className="hover:text-[var(--accent-red)] transition">JOIN TEAM</Link>
                <a href="https://github.com/Ruban-srijith/dogFoodHackathon" target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan)]/20 transition">SPEC</a>
              </div>
            </div>

            {/* Right Actions & Auth State */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2.5">
                  <Link
                    to={
                      user.role === 'ADMIN'
                        ? '/admin/audit'
                        : user.role === 'ORGANIZER'
                        ? '/organizer/dashboard'
                        : user.role === 'JUDGE'
                        ? '/judge/dashboard'
                        : '/participant/dashboard'
                    }
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] hover:border-[#A78BFA] transition text-xs font-mono"
                    title="Open Dashboard"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span className="font-semibold text-[#E2E8F0] hidden sm:inline">{user.full_name}</span>
                    <RoleBadge role={user.role} />
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-[var(--text-muted)] hover:text-rose-400 p-2"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-mono text-xs">
                      SIGN IN
                    </Button>
                  </Link>
                  <Link
                    to="/events"
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--accent-red)] hover:opacity-90 text-white text-xs font-mono font-black tracking-wider uppercase transition shadow-md"
                  >
                    EXPLORE
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Global Slide-Out Navigation Drawer */}
      <NavigationDrawer />
    </>
  );
};
