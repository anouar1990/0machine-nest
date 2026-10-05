'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { ShieldCheck, Percent, Layers, Euro, Timer } from 'lucide-react';

export const PersonalRecordsCard: React.FC = () => {
  const { userStats } = useNestStore();
  const records = userStats.personalRecords;

  const list = [
    { label: 'Best Utilization', value: `${records.bestUtilization}%`, icon: Percent, color: 'text-cyan-400' },
    { label: 'Lowest Waste', value: `${records.lowestWaste}%`, icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Most Parts', value: `${records.mostParts} pcs`, icon: Layers, color: 'text-amber-400' },
    { label: 'Most Material Saved', value: `€${records.mostMaterialSavedEur}`, icon: Euro, color: 'text-indigo-400' },
    { label: 'Fastest Nest', value: `${records.fastestNestSec} s`, icon: Timer, color: 'text-pink-400' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wider font-mono">
          PERSONAL RECORDS
        </h3>
        <span className="text-xs font-mono text-slate-500">WORKSHOP BESTS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {list.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <div
              key={i}
              className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase">{rec.label}</span>
                <Icon className={`w-3.5 h-3.5 ${rec.color}`} />
              </div>
              <div className={`text-base font-extrabold font-mono text-white ${rec.color}`}>
                {rec.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
