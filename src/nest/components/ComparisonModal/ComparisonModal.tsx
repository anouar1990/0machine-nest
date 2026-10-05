'use client';

import React from 'react';
import { OptimizationComparison } from '../../core/types';
import { TrendingDown, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface ComparisonModalProps {
  comparison: OptimizationComparison;
  onClose: () => void;
  onApply: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  comparison,
  onClose,
  onApply,
}) => {
  const { before, after, saved } = comparison;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            TRUE-SHAPE OPTIMIZATION COMPLETE
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-mono tracking-tight">
            OPTIMIZATION SUMMARY
          </h2>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BEFORE CARD */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider">BEFORE OPTIMIZATION</span>
              <span className="text-slate-500">Manual / Standard</span>
            </div>

            <div className="space-y-2 font-mono">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Sheets Required:</span>
                <span className="font-bold text-white">{before.sheetCount} sheets</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Material Waste:</span>
                <span className="font-bold text-amber-400">{before.wastePercentage}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Material Cost:</span>
                <span className="font-bold text-white">€{before.totalMaterialCostEur.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* AFTER CARD */}
          <div className="p-5 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                AFTER TRUE-SHAPE OPTIMIZATION
              </span>
            </div>

            <div className="space-y-2 font-mono">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Sheets Required:</span>
                <span className="font-bold text-emerald-400">{after.sheetCount} sheets</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Material Waste:</span>
                <span className="font-bold text-emerald-400">{after.wastePercentage}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Material Cost:</span>
                <span className="font-bold text-emerald-400">€{after.totalMaterialCostEur.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SAVINGS HIGHLIGHT BANNER */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                TOTAL MATERIAL SAVINGS
              </span>
              <span className="text-lg font-extrabold text-white font-mono">
                Saved {saved.sheetsSaved} sheet{saved.sheetsSaved !== 1 ? 's' : ''} ({saved.wasteReducedPercentage}% less waste)
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block">COST SAVED</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              €{saved.costSavedEur.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            DISCARD
          </button>
          <button
            onClick={onApply}
            className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg shadow-cyan-500/20"
          >
            APPLY OPTIMIZED NEST
          </button>
        </div>
      </div>
    </div>
  );
};
