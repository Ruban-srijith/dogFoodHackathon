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
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-[4px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] focus:ring-offset-2 focus:ring-offset-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#A78BFA] text-[#0F172A] hover:bg-[#b8a0fb] active:bg-[#9774f7] border-0',
    secondary:
      'bg-[#1E293B] text-[#E2E8F0] border border-[#334155] hover:border-[#A78BFA] hover:text-[#A78BFA]',
    outline:
      'border border-[#334155] hover:border-[#A78BFA] bg-transparent text-[#E2E8F0] hover:text-[#A78BFA]',
    danger:
      'bg-[#F87171] text-[#0F172A] hover:bg-[#fca5a5] border-0',
    ghost:
      'bg-transparent hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#E2E8F0] border border-transparent',
    glow:
      'bg-[#A78BFA] text-[#0F172A] hover:bg-[#b8a0fb] border-0',
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
