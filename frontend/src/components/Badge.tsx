import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  const variantClasses = {
    default: 'bg-slate-800/80 text-slate-300 border border-slate-700/70',
    success: 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-950/70 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    danger: 'bg-rose-950/70 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    info: 'bg-sky-950/70 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]',
    purple: 'bg-indigo-950/70 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(129,140,248,0.15)]',
  }[variant];

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    purple: 'bg-indigo-400',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider select-none ${sizeClasses} ${variantClasses} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {children}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const variantMap: Record<string, BadgeProps['variant']> = {
    ADMIN: 'danger',
    ORGANIZER: 'purple',
    JUDGE: 'warning',
    PARTICIPANT: 'info',
    VISITOR: 'default',
  };

  return <Badge variant={variantMap[role] || 'default'}>{role}</Badge>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variantMap: Record<string, BadgeProps['variant']> = {
    published: 'info',
    ongoing: 'success',
    voting: 'purple',
    judging: 'warning',
    closed: 'default',
    draft: 'default',
    submitted: 'success',
    completed: 'success',
    in_progress: 'warning',
    assigned: 'info',
  };

  const isLive = ['ongoing', 'voting', 'submitted', 'in_progress'].includes(status);

  return (
    <Badge variant={variantMap[status] || 'default'} dot={isLive}>
      {status.replace('_', ' ')}
    </Badge>
  );
};
