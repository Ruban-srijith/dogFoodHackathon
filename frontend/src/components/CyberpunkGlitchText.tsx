import React, { useState } from 'react';

export interface CyberpunkGlitchTextProps {
  text: string;
  className?: string;
}

export const CyberpunkGlitchText: React.FC<CyberpunkGlitchTextProps> = ({ text, className = '' }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  const triggerGlitch = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 300);
  };

  return (
    <span
      onMouseEnter={triggerGlitch}
      className={`relative inline-block cursor-default select-none transition-all ${className}`}
    >
      <span className="relative z-10">{text}</span>

      {isGlitching && (
        <>
          {/* Cyan Shift Layer */}
          <span
            className="absolute top-0 left-0 z-0 text-cyan-400 opacity-80 animate-pulse pointer-events-none"
            style={{ transform: 'translate(-2px, 1px)' }}
          >
            {text}
          </span>
          {/* Hot Pink Shift Layer */}
          <span
            className="absolute top-0 left-0 z-0 text-rose-500 opacity-80 animate-pulse pointer-events-none"
            style={{ transform: 'translate(2px, -1px)' }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
};
