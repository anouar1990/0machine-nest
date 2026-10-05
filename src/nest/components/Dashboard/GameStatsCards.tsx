'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Trophy, Percent, Layers, Euro } from 'lucide-react';

export const GameStatsCards: React.FC = () => {
  const { userStats } = useNestStore();

  const stats = [
    {
      title: 'NESTING SCORE',
      value: `${userStats.score}`,
      unit: 'SCORE',
      icon: Trophy,
      color: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
    },
    {
      title: 'AVERAGE WASTE',
      value: `${userStats.averageWastePercentage}%`,
      unit: 'WASTE',
      icon: Percent,
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
    },
    {
      title: 'JOBS COMPLETED',
      value: `${userStats.jobsCompleted}`,
      unit: 'JOBS',
      icon: Layers,
      color: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
    },
    {
      title: 'MATERIAL SAVED',
      value: `€${userStats.totalMaterialSavedEur}`,
      unit: 'SAVED',
      icon: Euro,
      color: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className={`relative bg-slate-900/80 border ${stat.borderColor} rounded-xl p-5 shadow-lg backdrop-blur-md overflow-hidden group hover:border-slate-700 transition-all`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-40 group-hover:opacity-70 transition-opacity`} />
            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2 rounded-lg bg-slate-950/60 ${stat.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="relative z-10 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {stat.value}
              </span>
              <span className={`text-xs font-mono font-semibold ${stat.textColor}`}>
                {stat.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
