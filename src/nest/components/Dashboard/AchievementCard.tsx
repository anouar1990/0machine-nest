'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Award, Zap, Target, Trophy, Lock } from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Zap,
  Target,
  Award,
  Trophy,
};

export const AchievementCard: React.FC = () => {
  const { achievements } = useNestStore();

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-sm font-bold text-white tracking-wider font-mono">
            WORKSHOP ACHIEVEMENTS
          </h3>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          {achievements.filter((a) => a.unlocked).length} / {achievements.length} UNLOCKED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((item) => {
          const IconComponent = iconMap[item.iconName] || Trophy;

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${
                item.unlocked
                  ? 'bg-slate-950/70 border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                  : 'bg-slate-950/30 border-slate-850 opacity-60'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg font-mono flex items-center justify-center shrink-0 ${
                  item.unlocked
                    ? 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {item.unlocked ? (
                  <IconComponent className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white font-mono">
                    {item.title}
                  </h4>
                  {item.unlocked && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
