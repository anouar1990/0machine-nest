import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { getExplainableScoreBreakdown } from '../../nesting/scoring/scoreBreakdown';
import { Award, Sparkles, X, CheckCircle, Info } from 'lucide-react';

export function ScoreBreakdownModal() {
  const { scoreBreakdownModalOpen, setScoreBreakdownModalOpen, parts, sheet } = useNestStore();

  if (!scoreBreakdownModalOpen) return null;

  const breakdown = getExplainableScoreBreakdown(parts, sheet);

  const metrics = [
    {
      name: 'Material Utilization',
      score: breakdown.materialUtilizationScore,
      description: 'Percentage of usable sheet stock occupied by nested cut geometry.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      name: 'Waste Efficiency',
      score: breakdown.wasteEfficiencyScore,
      description: 'Efficiency rating inversely proportional to raw material scrap %.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Sheet Packing Efficiency',
      score: breakdown.sheetEfficiencyScore,
      description: 'Density of part allocation across active production sheets.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Layout Quality & Safety',
      score: breakdown.layoutQualityScore,
      description: 'Accuracy of clearance spacing, edge distance and zero overlaps.',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Nesting Score Breakdown</h2>
              <p className="text-xs text-slate-400">Algorithmic metrics explanation & optimization metrics</p>
            </div>
          </div>
          <button
            onClick={() => setScoreBreakdownModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Score Highlight */}
          <div className="p-5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                OVERALL NESTING SCORE
              </span>
              <p className="text-3xl font-extrabold text-white mt-1">
                {breakdown.overallScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-extrabold text-2xl shadow-lg shadow-cyan-950">
              {breakdown.overallScore}
            </div>
          </div>

          {/* Sub-Metrics Progress Bars */}
          <div className="space-y-4">
            {metrics.map((m, idx) => (
              <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{m.name}</span>
                  <span className="text-xs font-extrabold text-cyan-400">{m.score} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{m.description}</p>
              </div>
            ))}
          </div>

          {/* Detailed Explanations */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Optimization Audit Insights
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5">
              {breakdown.explanation.map((exp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
