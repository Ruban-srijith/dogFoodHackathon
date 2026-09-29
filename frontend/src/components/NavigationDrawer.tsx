import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { RoleBadge } from './Badge';
import { Button } from './Button';
import {
  X,
  Users,
  ShieldAlert,
  BarChart3,
  Calendar,
  Gavel,
  Award,
  Trophy,
  FilePlus2,
  UserPlus,
  LayoutGrid,
  Compass,
  Info,
  LogOut,
  LogIn,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NavigationDrawer: React.FC = () => {
  const { isNavOpen, closeNav } = useNavigation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavOpen) {
        closeNav();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavOpen, closeNav]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNavOpen]);

  if (!isNavOpen) return null;

  const handleLogout = async () => {
    closeNav();
    await logout();
    navigate('/login', { replace: true, state: null });
  };

  const role = (user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOrganizer = role === 'ORGANIZER' || isAdmin;
  const isJudge = role === 'JUDGE' || isAdmin || isOrganizer;
  const isParticipant = role === 'PARTICIPANT' || (!isAdmin && !isOrganizer && !isJudge);

  const groups: NavGroup[] = [];

  // 1. System Administration (ADMIN)
  if (isAdmin) {
    groups.push({
      title: 'System Administration',
      items: [
        { to: '/admin/users', label: 'User Directory & Roles', icon: Users },
        { to: '/admin/audit', label: 'Security Audit Logs', icon: ShieldAlert },
      ],
    });
  }

  // 2. Organizer Event Management (ORGANIZER or ADMIN)
  if (isOrganizer) {
    groups.push({
      title: 'Event Management',
      items: [
        { to: '/organizer/dashboard', label: 'Organizer Console', icon: BarChart3 },
        { to: isAdmin ? '/admin/events' : '/organizer/events', label: 'Manage Hackathons', icon: Calendar },
        { to: '/organizer/judges', label: 'Judge Assignments', icon: Gavel },
        { to: '/organizer/results', label: 'Scoring & Leaderboard', icon: Award },
      ],
    });
  }

  // 3. Jury & Evaluation (JUDGE, ORGANIZER, or ADMIN)
  if (isJudge) {
    groups.push({
      title: 'Jury & Evaluation',
      items: [
        { to: '/judge/dashboard', label: 'Evaluation Queue', icon: Trophy },
      ],
    });
  }

  // 4. Participant Workspace (Authenticated Participants/All)
  if (user && isParticipant) {
    groups.push({
      title: 'Participant Workspace',
      items: [
        { to: '/submissions/new', label: 'Submit Project', icon: FilePlus2 },
        { to: '/teams/new', label: 'Create Team', icon: Users },
        { to: '/teams/join', label: 'Join Team', icon: UserPlus },
      ],
    });
  }

  // 5. Platform Exploration (All Roles & Guests)
  groups.push({
    title: 'Platform Navigation',
    items: [
      { to: '/events', label: 'Hackathons & Events', icon: Compass },
      { to: '/gallery', label: 'Project Gallery', icon: LayoutGrid },
      { to: '/#about', label: 'About Platform', icon: Info },
    ],
  });

  const portalBadge = isAdmin
    ? 'ADMIN CONSOLE'
    : isOrganizer
    ? 'ORGANIZER CONSOLE'
    : user?.role === 'JUDGE'
    ? 'JURY EVALUATION'
    : user
    ? 'PARTICIPANT'
    : 'EXPLORER';

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={closeNav}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-[#0F172A] border-r border-[#334155] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 select-none">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#334155] flex items-center justify-between bg-[#0F172A]">
          <Link to="/" onClick={closeNav} className="flex items-center gap-2.5 group">
            {/* T-Rex Icon */}
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 flex items-center justify-center text-[var(--accent-red)] group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3h-4v2h-2v2h-2v2H9v2H7v2H5v2H3v6h2v-2h2v-2h2v4h2v-4h2v2h2v-2h2v-4h2v-2h2V9h-2V7h-2V5h-2V3z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 leading-none">
                <span className="font-extrabold text-base tracking-wider text-[#E2E8F0] font-mono">
                  DOGFOOD
                </span>
                <span className="text-[9px] font-mono text-[var(--accent-red)] font-bold">®</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#A78BFA] tracking-wider mt-0.5">
                {portalBadge}
              </span>
            </div>
          </Link>

          <button
            onClick={closeNav}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B] border border-transparent hover:border-[#334155] transition focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
            aria-label="Close Navigation Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {groups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] font-mono px-3 block">
                {group.title}
              </span>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  if (item.to.startsWith('http') || item.to.startsWith('/#')) {
                    return (
                      <a
                        key={item.to}
                        href={item.to}
                        onClick={closeNav}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0 text-[#A78BFA]" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.to.startsWith('http') && <ExternalLink className="w-3 h-3 text-[#94A3B8]" />}
                      </a>
                    );
                  }
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeNav}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30 font-semibold shadow-sm'
                            : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer / User Profile & Auth Actions */}
        <div className="p-4 border-t border-[#334155] bg-[#0F172A] space-y-3 shrink-0">
          {user ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#E2E8F0] truncate">{user.full_name || user.username}</span>
                  <RoleBadge role={user.role} />
                </div>
                <p className="text-[11px] text-[#A78BFA] font-mono truncate">{user.email}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs font-mono justify-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                SIGN OUT
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <Link to="/login" onClick={closeNav}>
                <Button variant="outline" size="sm" className="w-full text-xs justify-center">
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  SIGN IN
                </Button>
              </Link>
              <Link to="/register" onClick={closeNav}>
                <Button variant="primary" size="sm" className="w-full text-xs justify-center">
                  REGISTER
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
