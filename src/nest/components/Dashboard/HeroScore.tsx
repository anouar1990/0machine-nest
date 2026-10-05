'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

export const HeroScore: React.FC = () => {
  const { userStats, setActiveTab } = useNestStore();

  const score = userStats.score; // 94
  const progressPercent = score;

  return (
    <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
      {/* Subtle Cyan Glow Effect */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Score Presentation */}
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            TODAY&apos;S NESTING SCORE
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              {score}
            </span>
            <span className="text-2xl md:text-3xl font-bold text-slate-400 font-mono">
              / 100
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-950 rounded-full p-0.5 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                +8 points better than yesterday
              </span>
              <span>Personal Best: 97</span>
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex flex-col items-center md:items-end justify-center gap-3">
          <button
            onClick={() => setActiveTab('workspace')}
            className="group relative inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>START NEW NEST</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-xs text-slate-500 font-mono">
            Ready for 600×300 mm material stock
          </span>
        </div>
      </div>
    </div>
  );
};
