import React from 'react';

export const Marquee: React.FC = () => {
  const text = 'BUILD THE PLATFORM THAT WILL JUDGE YOU • BUILD THE PLATFORM THAT WILL JUDGE YOU • ';

  return (
    <div className="w-full bg-[#04060b] border-b border-rose-500/30 overflow-hidden py-1.5 select-none font-mono text-[11px] tracking-widest text-rose-500 font-bold uppercase">
      <div className="animate-marquee whitespace-nowrap">
        <span>{text.repeat(8)}</span>
        <span>{text.repeat(8)}</span>
      </div>
    </div>
  );
};
