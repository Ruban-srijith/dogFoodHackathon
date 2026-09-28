import React, { useEffect, useState } from 'react';

export const GlyphCycle: React.FC = () => {
  const glyphs = ['✦', '◈', '◆', '◇', '⬡', '⚡', '☍', '✴'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % glyphs.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [glyphs.length]);

  return (
    <span className="inline-block text-rose-500 transition-transform duration-300 transform hover:scale-125 font-mono">
      {glyphs[index]}
    </span>
  );
};
