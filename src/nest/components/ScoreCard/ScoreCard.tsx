'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Sparkles, PieChart, Layers, ShieldCheck, Euro } from 'lucide-react';

export const ScoreCard: React.FC = () => {
  const { getScore } = useNestStore();
  const stats = getScore();

  return (
    <footer className="h-10 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between z-20 font-mono text-xs text-slate-400 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Parts: <strong className="text-white">{stats.totalPartsPlaced}</strong> / {stats.totalPartsAvailable}
          </span>
        </div>

        <div className="w-px h-4 bg-slate-800" />

        <div className="flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Utilization: <strong className="text-emerald-400">{stats.utilizationPercentage}%</strong>
          </span>
        </div>

        <div className="w-px h-4 bg-slate-800" />

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Waste: <strong className="text-amber-400">{stats.wastePercentage}%</strong>
          </span>
        </div>

        <div className="w-px h-4 bg-slate-800" />

        <div className="flex items-center gap-2">
          <Euro className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Material Value Placed: <strong className="text-indigo-400">€{stats.materialSavedEur}</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="text-slate-400">NESTING SCORE:</span>
        <span className="text-sm font-black font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
          {stats.score} / 100
        </span>
      </div>
    </footer>
  );
};
