import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  delayMs?: number;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading telemetry...',
  size = 'md',
  fullScreen = false,
  delayMs = 120,
}) => {
  const [show, setShow] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!show) return null;

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-4 text-center animate-in fade-in duration-300 select-none">
      {/* Brutalist Glowing Indicator */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#A78BFA]/20 blur-md animate-ping" />
        <Loader2 className={`${iconSizes} animate-spin text-[#A78BFA] relative z-10`} />
      </div>

      {message && (
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold tracking-wider text-[#E2E8F0] uppercase">
            {message}
          </p>
          <p className="text-[10px] font-mono text-[#94A3B8]">
            DOGFOOD SECURE TELEMETRY ENGINE
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};

// Shimmer Skeleton for Delayed-Loading Tables
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="rounded-xl border border-[#334155] bg-[#1E293B] p-4 space-y-3 animate-pulse select-none">
    <div className="h-6 bg-[#334155]/60 rounded-md w-1/3 mb-4" />
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-[#334155]/40">
          <div className="h-4 bg-[#334155]/50 rounded w-1/4" />
          <div className="h-4 bg-[#334155]/40 rounded w-1/3" />
          <div className="h-4 bg-[#334155]/30 rounded w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

// Shimmer Skeleton for Delayed-Loading Card Bento Grids
export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse select-none">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 space-y-4">
        <div className="h-40 bg-[#334155]/40 rounded-lg w-full" />
        <div className="h-5 bg-[#334155]/60 rounded w-3/4" />
        <div className="h-3 bg-[#334155]/40 rounded w-full" />
        <div className="h-3 bg-[#334155]/30 rounded w-2/3" />
      </div>
    ))}
  </div>
);
