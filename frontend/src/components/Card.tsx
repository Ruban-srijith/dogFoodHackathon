import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, glow = false, className = '', ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 backdrop-blur-xl shadow-xl transition-all duration-250 text-[var(--text-main)] ${
        hover ? 'hover:border-[var(--border-hover)] hover:-translate-y-1 hover:shadow-2xl' : ''
      } ${
        glow ? 'glow-border' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
