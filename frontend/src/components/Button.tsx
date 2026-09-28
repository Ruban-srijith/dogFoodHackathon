import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer font-mono';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-bold',
  }[size];

  const variantClasses = {
    primary: 'bg-[var(--accent-cyan)] text-[var(--bg-primary)] hover:brightness-110 font-bold shadow-lg border border-[var(--border-hover)]',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface)] shadow-sm',
    outline: 'border border-[var(--border-color)] hover:border-[var(--border-hover)] bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-card)]',
    danger: 'bg-[var(--accent-red)] text-white font-bold shadow-lg border border-red-400/30',
    ghost: 'bg-transparent hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]',
    glow: 'bg-[var(--accent-red)] text-white font-black uppercase tracking-wider shadow-lg border border-[var(--border-hover)] hover:scale-105 transition-transform',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
