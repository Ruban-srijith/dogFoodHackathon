import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  Calendar,
  Users,
  Award,
  ShieldAlert,
  BarChart3,
  Gavel,
  FileCheck2,
} from 'lucide-react';

export interface SidebarProps {
  portal: 'judge' | 'organizer' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ portal }) => {
  const { user } = useAuth();

  const judgeLinks = [
    { to: '/judge/dashboard', label: 'Evaluation Queue', icon: Trophy },
    { to: '/judge/submissions', label: 'Assigned Submissions', icon: FileCheck2 },
  ];

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Overview', icon: BarChart3 },
    { to: '/organizer/events', label: 'Manage Hackathons', icon: Calendar },
    { to: '/organizer/judges', label: 'Judge Assignments', icon: Gavel },
    { to: '/organizer/results', label: 'Scoring & Results', icon: Award },
  ];

  const adminLinks = [
    { to: '/admin/users', label: 'User Directory & Roles', icon: Users },
    { to: '/admin/events', label: 'Global Hackathons', icon: Calendar },
    { to: '/admin/audit', label: 'Security Audit Logs', icon: ShieldAlert },
  ];

  const links = portal === 'judge' ? judgeLinks : portal === 'organizer' ? organizerLinks : adminLinks;
  const portalTitle = portal === 'judge' ? 'Judge Portal' : portal === 'organizer' ? 'Organizer Console' : 'System Administration';

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-dark-950/50 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
            {portalTitle}
          </span>
          <nav className="mt-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Signed in as</p>
        <p className="truncate text-emerald-400 font-mono mt-0.5">{user?.email}</p>
      </div>
    </aside>
  );
};
