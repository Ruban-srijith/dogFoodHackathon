import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  sharp?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, sharp = false, className = '', ...props }) => {
  return (
    <div
      className={`${sharp ? 'rounded-[4px]' : 'rounded-[16px]'} border border-[#334155] bg-[#1E293B] p-6 text-[#E2E8F0] transition-colors duration-150 ${
        hover ? 'hover:border-[#A78BFA]/40' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
