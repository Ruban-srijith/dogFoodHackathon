import React from 'react';

export const Relief: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Cyber Hackathon Circuit & Network Background Image */}
      <img
        src="/hackathon-bg.jpg"
        alt="Hackathon Background Architecture"
        className="fixed inset-0 w-full h-full object-cover object-center"
      />
      {/* Dark Slate Vignette & Translucent Overlay to ensure high-contrast legibility */}
      <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-[0.5px]" />
      {/* Technical Blueprint Grid Pattern */}
      <div className="absolute inset-0 blueprint-grid-overlay opacity-25" />
    </div>
  );
};
