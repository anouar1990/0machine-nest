import React, { useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Zap, Upload, Layers, Play, Download, ArrowRight, Check, X } from 'lucide-react';

export function OnboardingModal() {
  const { onboardingModalOpen, setOnboardingModalOpen, setActiveTab } = useNestStore();
  const [step, setStep] = useState(0);

  if (!onboardingModalOpen) return null;

  const steps = [
    {
      title: 'Welcome to 0Machine Nest',
      subtitle: 'Professional True-Shape SVG Nesting & Material Optimization SaaS',
      icon: Zap,
      content:
        '0Machine Nest optimizes vector SVG parts for laser cutting and CNC router production. Maximize sheet utilization, eliminate material scrap, and earn XP as you beat your nest scores.',
    },
    {
      title: '1. Import SVG Files',
      subtitle: 'Seamless vector geometry parsing',
      icon: Upload,
      content:
        'Drag & drop SVG files into the parts panel. 0Machine Nest automatically normalizes scale, extracts inner cutouts/holes, and computes geometric bounds.',
    },
    {
      title: '2. Configure Raw Sheet Stock',
      subtitle: 'Set custom dimensions, margins & clearance',
      icon: Layers,
      content:
        'Define exact sheet size (e.g. 600x300mm), set safety margins, and specify part-to-part spacing (e.g. 3.0mm clearance). Select from material presets or create custom stock.',
    },
    {
      title: '3. Run True-Shape Nesting Engine',
      subtitle: 'Multi-start polygon placement & SAT collision',
      icon: Play,
      content:
        'Click "OPTIMIZE LAYOUT". The engine runs multi-start placement strategies with true-shape SAT collision and multi-sheet allocation in a background worker.',
    },
    {
      title: '4. Inspect Savings & Export SVG',
      subtitle: 'Production-ready vector export',
      icon: Download,
      content:
        'Review the Before vs. After comparison, material cost savings in €, and export clean, production-ready SVGs directly to your workshop laser cutter.',
    },
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setOnboardingModalOpen(false);
      setActiveTab('workspace');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d1322]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Onboarding Guide ({step + 1} / {steps.length})
            </span>
          </div>
          <button
            onClick={() => setOnboardingModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-950 to-blue-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mx-auto shadow-lg shadow-cyan-950">
            <StepIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight">{currentStep.title}</h3>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">{currentStep.subtitle}</p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto pt-2">{currentStep.content}</p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1322] flex items-center justify-between">
          <button
            onClick={() => setOnboardingModalOpen(false)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Skip Tour
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            {step === steps.length - 1 ? 'Start Nesting Now' : 'Next Step'}
            {step === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
