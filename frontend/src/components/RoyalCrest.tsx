import React from 'react';
import { Crown, Sparkles, Award, Shield, Flame, Star } from 'lucide-react';

export const RoyalCrest: React.FC = () => {
  return (
    <div className="relative my-8 p-8 md:p-12 rounded-3xl border-2 border-[#ffd700]/50 bg-gradient-to-b from-[#0f172a]/90 via-[#070b16]/95 to-[#020617] backdrop-blur-2xl shadow-[0_0_50px_rgba(255,215,0,0.2)] overflow-hidden group">
      {/* Background Animated Gold Light Beams & Dust */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/20 blur-[100px] pointer-events-none rounded-full animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-500/20 blur-[100px] pointer-events-none rounded-full animate-pulse" />

      {/* Royal Corner Filigree Ornaments */}
      <div className="absolute top-3 left-3 text-[#ffd700] opacity-80 pointer-events-none font-serif text-xl">
        ⚜️
      </div>
      <div className="absolute top-3 right-3 text-[#ffd700] opacity-80 pointer-events-none font-serif text-xl">
        ⚜️
      </div>
      <div className="absolute bottom-3 left-3 text-[#ffd700] opacity-80 pointer-events-none font-serif text-xl">
        ⚜️
      </div>
      <div className="absolute bottom-3 right-3 text-[#ffd700] opacity-80 pointer-events-none font-serif text-xl">
        ⚜️
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Section: Royal Crest Shield */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {/* Pulsing Golden Crown Aura */}
            <div className="absolute inset-0 rounded-2xl bg-amber-400/30 blur-xl animate-ping" />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-[2px] shadow-2xl shadow-amber-500/40">
              <div className="w-full h-full bg-[#070b16] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Crown className="w-10 h-10 md:w-12 md:h-12 text-[#ffd700] animate-bounce" />
                <Sparkles className="w-4 h-4 text-amber-200 absolute top-2 right-2 animate-spin" />
              </div>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#ffd700] uppercase">
              <Award className="w-4 h-4 text-[#ffd700]" /> Imperial Royal Arena
            </div>
            <h2 className="text-2xl md:text-4xl font-black font-mono royal-gold-gradient-text tracking-tight">
              DOGFOOD ROYAL EDITION
            </h2>
            <p className="text-xs md:text-sm text-amber-200/80 font-sans max-w-xl">
              Elevated to royal prestige. Experience sovereign evaluation queues, golden trophy leaderboards, and imperial hackathon honors.
            </p>
          </div>
        </div>

        {/* Right Section: Royal Badges */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-[#ffd700]/40 flex items-center gap-2 text-xs font-mono text-[#ffd700]">
            <Shield className="w-4 h-4 text-[#ffd700]" />
            <span>Regal Isolation</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center gap-2 text-xs font-mono text-rose-300">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Grand Laurels</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center gap-2 text-xs font-mono text-emerald-300">
            <Star className="w-4 h-4 text-emerald-400" />
            <span>Crown Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
