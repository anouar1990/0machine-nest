'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Flame, Award, ArrowRight } from 'lucide-react';

export const DailyMissionCard: React.FC = () => {
  const { missions, setActiveTab } = useNestStore();

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
          <h3 className="text-sm font-bold text-white tracking-wider font-mono">
            TODAY&apos;S MISSIONS
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          Resets in 14h 22m
        </span>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  {mission.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mission.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                <Award className="w-3.5 h-3.5" />
                +{mission.rewardXp} XP
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${mission.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>
                  Current: {mission.currentValue} | Target: {mission.targetValue}
                </span>
                <span>{mission.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setActiveTab('workspace')}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono font-semibold text-xs rounded-lg transition-colors border border-slate-700"
      >
        <span>CONTINUE MISSION IN WORKSPACE</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
