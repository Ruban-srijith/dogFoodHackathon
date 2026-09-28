import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlyphCycle } from './GlyphCycle';
import { ScrollRing } from './ScrollRing';
import { MenuOverlay } from './MenuOverlay';

export const FixedUI: React.FC = () => {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolledPastHero(window.scrollY > 300);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Persistent Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Persistent Fixed UI Container */}
      <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-8">
        
        {/* Top-Right: "Menu" Text Link with Monogram Fade-in */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setMenuOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-[#060911]/90 backdrop-blur-md text-xs font-mono font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-400 transition shadow-lg cursor-pointer"
          >
            {/* Monogram icon fades in when scrolled past hero */}
            <span
              className={`w-5 h-5 rounded-md bg-rose-500/20 text-rose-500 flex items-center justify-center text-[10px] font-black border border-rose-500/30 transition-all duration-300 ${
                scrolledPastHero ? 'opacity-100 scale-100' : 'opacity-0 scale-75 w-0 px-0 overflow-hidden'
              }`}
            >
              DF
            </span>
            <span>Menu</span>
          </button>
        </div>

        {/* Bottom-Left & Bottom-Right persistent controls */}
        <div className="flex items-end justify-between w-full">
          {/* Bottom-Left: "See all projects" link with GlyphCycle */}
          <Link
            to="/gallery"
            className="pointer-events-auto inline-flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 hover:text-cyan-400 px-3 py-1.5 rounded-xl bg-[#060911]/80 backdrop-blur-md border border-slate-800/80 hover:border-cyan-500/30 transition shadow-md"
          >
            <span>See all projects</span>
            <GlyphCycle />
          </Link>

          {/* Bottom-Right: SVG Circular Scroll Progress Ring */}
          <div className="pointer-events-auto bg-[#060911]/80 backdrop-blur-md p-1 rounded-full border border-slate-800/80 shadow-md">
            <ScrollRing />
          </div>
        </div>

      </div>
    </>
  );
};
