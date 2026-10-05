'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Zap } from 'lucide-react';

export const XPLevelCard: React.FC = () => {
  const { userStats } = useNestStore();

  const xpPercentage = Math.round((userStats.xp / userStats.xpToNextLevel) * 100);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl font-mono font-black text-slate-950 text-xl shadow-lg shadow-cyan-500/20">
            {userStats.level}
            <div className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 rounded-full text-amber-400">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              LEVEL {userStats.level} RANK
            </div>
            <h3 className="text-lg font-extrabold text-white">
              {userStats.levelTitle}
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">WORKSHOP XP</span>
          <span className="text-cyan-400 font-bold">
            {userStats.xp.toLocaleString()} / {userStats.xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full p-0.5 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,240,255,0.6)]"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/80">
        <div>
          <span className="block text-[10px] text-slate-500">SHEETS OPTIMIZED</span>
          <span className="text-white font-bold">{userStats.sheetsOptimized} Sheets</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500">NEXT RANK UNLOCK</span>
          <span className="text-amber-400 font-bold">Master Nest Architect</span>
        </div>
      </div>
    </div>
  );
};
