import React, { useState } from 'react';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const themeOptions: { id: ThemeMode; name: string; tag: string; bg: string; accent: string }[] = [
    { id: 'telemetry', name: 'Telemetry CRT', tag: 'SCREENSHOT DEFAULT', bg: '#060911', accent: '#ff2a5f' },
    { id: 'swiss', name: 'Swiss Print', tag: 'LIGHT NEWSPRINT', bg: '#f4f4f0', accent: '#e61919' },
    { id: 'matrix', name: 'Matrix Terminal', tag: 'CYBER GREEN', bg: '#040a04', accent: '#4af626' },
    { id: 'obsidian', name: 'Obsidian Tech', tag: 'DARK SLATE', bg: '#080c14', accent: '#38bdf8' },
    { id: 'monochrome', name: 'Monochrome Raw', tag: 'HIGH CONTRAST', bg: '#000000', accent: '#ffffff' },
  ];

  const currentTheme = themeOptions.find((t) => t.id === theme) || themeOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 text-xs font-mono font-semibold text-slate-200 hover:border-slate-500 transition shadow-sm cursor-pointer"
        title="Change Theme Paradigm"
      >
        <Palette className="w-3.5 h-3.5 text-rose-500" />
        <span className="hidden sm:inline">{currentTheme.name}</span>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.accent }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 z-50 rounded-2xl border border-slate-700/90 bg-[#080c14] p-2 shadow-2xl space-y-1 font-mono text-xs">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              Select Interface Theme
            </div>
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  theme === opt.id
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full border border-slate-600 shrink-0" style={{ backgroundColor: opt.bg }} />
                  <div>
                    <span className="block font-semibold text-slate-200 leading-none">{opt.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{opt.tag}</span>
                  </div>
                </div>
                {theme === opt.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
