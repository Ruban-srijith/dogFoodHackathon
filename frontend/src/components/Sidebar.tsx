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
  Compass,
  Sparkles,
  FilePlus2,
  UserPlus,
} from 'lucide-react';

export interface SidebarProps {
  portal: 'judge' | 'organizer' | 'admin' | 'participant';
}

interface NavGroup {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ portal: _portal }) => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOrganizer = role === 'ORGANIZER' || isAdmin;
  const isJudge = role === 'JUDGE' || isOrganizer || isAdmin;
  const isParticipant = role === 'PARTICIPANT' || (!isAdmin && !isOrganizer && !isJudge);

  // Build categorized groups based on role permissions
  const groups: NavGroup[] = [];

  // 1. Participant Workspace Section (Accessible to all participants, and admins)
  if (isParticipant || isAdmin) {
    groups.push({
      title: 'Participant Workspace',
      items: [
        { to: '/participant/dashboard', label: 'Participant Hub', icon: Sparkles },
        { to: '/submissions/new', label: 'Submit Project', icon: FilePlus2 },
        { to: '/teams/new', label: 'Create Team', icon: Users },
        { to: '/teams/join', label: 'Join Team', icon: UserPlus },
      ],
    });
  }

  // 2. Admin Control Section
  if (isAdmin) {
    groups.push({
      title: 'Administration',
      items: [
        { to: '/admin/users', label: 'User Directory & Roles', icon: Users },
        { to: '/admin/audit', label: 'Security Audit Logs', icon: ShieldAlert },
      ],
    });
  }

  // 3. Organizer & Competition Orchestration Section
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

  // 4. Jury & Evaluation Section (Accessible to Judges, Organizers, and Admins)
  if (isJudge) {
    groups.push({
      title: 'Jury & Evaluation',
      items: [
        { to: '/judge/dashboard', label: 'Evaluation Queue', icon: Trophy },
        { to: '/judge/submissions', label: 'Assigned Submissions', icon: FileCheck2 },
      ],
    });
  }

  // 5. Public & Platform Exploration Section
  groups.push({
    title: 'Platform Navigation',
    items: [
      { to: '/gallery', label: 'Project Gallery', icon: LayoutGrid },
      { to: '/events', label: 'Hackathons & Rules', icon: Compass },
    ],
  });

  const portalHeader = isAdmin
    ? 'System Master Admin'
    : isOrganizer
    ? 'Organizer Console'
    : role === 'JUDGE'
    ? 'Jury Evaluation Portal'
    : 'Participant Hub';

  return (
    <aside
      data-lenis-prevent
      className="hidden lg:flex w-64 shrink-0 border-r border-[#334155] bg-[#0F172A] p-4 sticky top-16 h-[calc(100vh-4rem)] self-start flex-col justify-between select-none z-30 overflow-hidden"
    >
      {/* Scrollable Navigation Groups */}
      <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        <div className="px-3 pb-1 border-b border-[#334155]/60 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA] font-mono">
            {portalHeader}
          </span>
          <span className="text-[10px] text-[#94A3B8] font-mono">v1.0</span>
        </div>

        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] font-mono px-3 block">
              {group.title}
            </span>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
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

      {/* Persistent User Status Chip */}
      <div className="pt-4 shrink-0 border-t border-[#334155]/60 mt-4">
        <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] text-xs text-[#94A3B8] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#E2E8F0] truncate">{user?.full_name || 'Active User'}</span>
            {user && <RoleBadge role={user.role} />}
          </div>
          <p className="truncate text-[#A78BFA] font-mono text-[11px]">{user?.email}</p>
        </div>
      </div>
    </aside>
  );
};
