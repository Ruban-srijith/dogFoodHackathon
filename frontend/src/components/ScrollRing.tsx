import React, { useEffect, useState } from 'react';

export const ScrollRing: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      const pct = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
      setProgress(pct);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const size = 36;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative w-9 h-9 flex items-center justify-center font-mono text-[9px] text-cyan-400 font-bold">
      <svg className="w-9 h-9 -rotate-90 transform">
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-rose-500 transition-all duration-150 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute">{Math.round(progress * 100)}%</span>
    </div>
  );
};
