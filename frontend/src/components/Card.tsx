import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, glow = false, className = '', ...props }) => {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all duration-200 text-[var(--text-primary)] ${
        hover ? 'hover:border-[#475569] hover:shadow-md' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
