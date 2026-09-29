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
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  const variantClasses = {
    default: 'bg-[#334155]/50 text-[#94A3B8] border border-[#334155]',
    success: 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30',
    info: 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30',
    purple: 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30',
  }[variant];

  const dotColors = {
    default: 'bg-[#94A3B8]',
    success: 'bg-[#4ADE80] animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-[#F87171]',
    info: 'bg-[#A78BFA]',
    purple: 'bg-[#A78BFA]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {children}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const variantMap: Record<string, BadgeProps['variant']> = {
    ADMIN: 'danger',
    ORGANIZER: 'purple',
    JUDGE: 'purple',
    PARTICIPANT: 'default',
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
