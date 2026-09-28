import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-950/60 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-950/60 text-rose-400 border border-rose-500/30',
    info: 'bg-sky-950/60 text-sky-400 border border-sky-500/30',
    purple: 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full uppercase tracking-wider select-none ${sizeClasses} ${variantClasses} ${className}`}>
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

  return <Badge variant={variantMap[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
};
