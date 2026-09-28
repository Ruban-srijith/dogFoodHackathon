import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { X, ArrowRight } from 'lucide-react';

export interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ isOpen, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !linksRef.current) return;

    if (isOpen) {
      // Staggered clip-path line mask reveal (0.8s, power3.out)
      gsap.to(overlayRef.current, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.5,
        ease: 'power3.out',
      });

      const navItems = linksRef.current.querySelectorAll('.menu-nav-item');
      gsap.fromTo(
        navItems,
        { y: 40, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        {
          y: 0,
          opacity: 1,
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.1,
        }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.4,
        ease: 'power3.out',
      });
    }
  }, [isOpen]);

  const navLinks = [
    { to: '/', label: 'HOME', subtitle: 'Overview & Main Telemetry' },
    { to: '/events', label: 'HACKATHONS', subtitle: 'Active & Upcoming Competitions' },
    { to: '/gallery', label: 'PROJECT GALLERY', subtitle: 'Public Showcase & Live Demos' },
    { to: '/judge/dashboard', label: 'JUDGE PORTAL', subtitle: 'Evaluation Queue & Rubrics' },
    { to: '/organizer/dashboard', label: 'ORGANIZER CONSOLE', subtitle: 'System Metrics & Results' },
    { to: '/login', label: 'SIGN IN / REGISTER', subtitle: 'Platform Authentication' },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-[#060911]/98 backdrop-blur-2xl opacity-0 pointer-events-none flex flex-col justify-between p-6 sm:p-12 text-[var(--text-main)] font-mono border border-cyan-500/20 shadow-2xl"
    >
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">[ NAVIGATION OVERLAY ]</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xs font-bold">CLOSE</span>
          <X className="w-4 h-4 text-rose-500" />
        </button>
      </div>

      {/* Main Staggered Links */}
      <div ref={linksRef} className="my-auto max-w-4xl space-y-6">
        {navLinks.map((link, idx) => (
          <div key={link.to} className="menu-nav-item overflow-hidden">
            <Link
              to={link.to}
              onClick={onClose}
              className="group flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800/80 pb-4 transition"
            >
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-rose-500 font-bold">0{idx + 1}.</span>
                <span className="text-3xl sm:text-5xl font-black tracking-tight group-hover:text-cyan-400 group-hover:translate-x-2 transition-all">
                  {link.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-normal flex items-center gap-1 group-hover:text-slate-200">
                {link.subtitle} <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="pt-4 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-slate-400">
        <div>DOGFOOD • Self-Hostable Telemetry Architecture</div>
        <div className="text-cyan-400 font-semibold">[ ESC OR CLICK CLOSE ]</div>
      </div>
    </div>
  );
};
