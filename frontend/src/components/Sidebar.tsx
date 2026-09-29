import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './Badge';
import {
  Trophy,
  Calendar,
  Users,
  Award,
  ShieldAlert,
  BarChart3,
  Gavel,
  FileCheck2,
  LayoutGrid,
} from 'lucide-react';

export interface SidebarProps {
  portal: 'judge' | 'organizer' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ portal }) => {
  const { user } = useAuth();

  const judgeLinks = [
    { to: '/judge/dashboard', label: 'Evaluation Queue', icon: Trophy },
    { to: '/judge/submissions', label: 'Assigned Submissions', icon: FileCheck2 },
    { to: '/gallery', label: 'Project Gallery', icon: LayoutGrid },
    { to: '/events', label: 'Hackathons & Rules', icon: Calendar },
    ...(user?.role === 'ORGANIZER' || user?.role === 'ADMIN'
      ? [{ to: '/organizer/results', label: 'Scoring & Results', icon: Award }]
      : []),
  ];

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Overview', icon: BarChart3 },
    { to: '/organizer/events', label: 'Manage Hackathons', icon: Calendar },
    { to: '/organizer/judges', label: 'Judge Assignments', icon: Gavel },
    { to: '/organizer/results', label: 'Scoring & Results', icon: Award },
    { to: '/gallery', label: 'Public Gallery', icon: LayoutGrid },
  ];

  const adminLinks = [
    { to: '/admin/users', label: 'User Directory & Roles', icon: Users },
    { to: '/admin/events', label: 'Global Hackathons', icon: Calendar },
    { to: '/admin/audit', label: 'Security Audit Logs', icon: ShieldAlert },
    { to: '/gallery', label: 'Project Gallery', icon: LayoutGrid },
  ];

  const links = portal === 'judge' ? judgeLinks : portal === 'organizer' ? organizerLinks : adminLinks;
  const portalTitle =
    portal === 'judge' ? 'Jury Portal' : portal === 'organizer' ? 'Organizer Console' : 'System Administration';

  return (
    <aside className="w-64 shrink-0 border-r border-[#334155] bg-[#0F172A] p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA] font-mono px-3">
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30 font-semibold shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]'
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

      <div className="p-3.5 rounded-xl bg-[#1E293B] border border-[#334155] text-xs text-[#94A3B8] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#E2E8F0]">Active Evaluator</span>
          {user && <RoleBadge role={user.role} />}
        </div>
        <p className="truncate text-[#A78BFA] font-mono text-[11px]">{user?.email}</p>
      </div>
    </aside>
  );
};
