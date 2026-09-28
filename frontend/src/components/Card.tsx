import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, glow = false, className = '', ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl transition-all duration-250 ${
        hover ? 'hover:border-slate-700/90 hover:bg-slate-900/80 hover:shadow-2xl hover:-translate-y-1' : ''
      } ${
        glow ? 'glow-border' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
