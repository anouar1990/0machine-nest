'use client';

import React, { useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import {
  Undo,
  Redo,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  BarChart2,
  Layers,
  Zap,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  X,
  Folder,
  Package,
  Command,
  HelpCircle,
  Flame,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  // Activate global keyboard shortcuts
  useKeyboardShortcuts();

  const {
    activeTab,
    setActiveTab,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    resetView,
    gridVisible,
    toggleGrid,
    rulersVisible,
    toggleRulers,
    getScore,
    isNesting,
    nestingProgress,
    startAutoNesting,
    cancelAutoNesting,
    alignSelectedParts,
    selectedPartIds,
    currentProjectName,
    renameCurrentProject,
    autosaveStatus,
    setProjectsModalOpen,
    setExportModalOpen,
    setMaterialsModalOpen,
    setShortcutsModalOpen,
    setScoreBreakdownModalOpen,
    setOnboardingModalOpen,
    streakDays,
  } = useNestStore();

  const scoreData = getScore();
  const [projNameInput, setProjNameInput] = useState(currentProjectName);
  const [prevName, setPrevName] = useState(currentProjectName);

  if (prevName !== currentProjectName) {
    setPrevName(currentProjectName);
    setProjNameInput(currentProjectName);
  }

  const handleNameBlur = () => {
    if (projNameInput.trim() && projNameInput !== currentProjectName) {
      renameCurrentProject(projNameInput.trim());
    }
  };

  return (
    <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between z-20 backdrop-blur-md">
      {/* Left Brand & Project Title */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 font-mono font-black text-slate-950 text-sm shadow-lg shadow-cyan-500/20">
            0M
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white font-mono tracking-wider flex items-center gap-1.5">
              0MACHINE NEST
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-bold border border-cyan-500/30">
                TRUE-SHAPE
              </span>
            </h1>
          </div>
        </div>

        {/* Project Title & Autosave Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
          <input
            type="text"
            value={projNameInput}
            onChange={(e) => setProjNameInput(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="bg-transparent text-xs font-semibold text-slate-200 hover:bg-slate-800/60 focus:bg-slate-950 px-2 py-1 rounded border border-transparent focus:border-cyan-500/50 focus:outline-none transition-all max-w-[180px] truncate"
            title="Click to rename project"
          />
          {autosaveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-medium" title="All changes saved to storage">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          {autosaveStatus === 'unsaved' && (
            <span className="text-[10px] text-slate-400 font-mono" title="Unsaved changes">
              • Unsaved
            </span>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-cyan-400 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-slate-800 text-cyan-400 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            WORKSPACE
          </button>
        </div>
      </div>

      {/* Middle Tool Controls */}
      {activeTab === 'workspace' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            {/* History */}
            <button
              onClick={() => undo()}
              disabled={!canUndo()}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo()}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            {/* Zoom */}
            <button
              onClick={() => setZoom((z) => Math.min(4.0, z * 1.15))}
              title="Zoom In"
              className="p-2 rounded text-slate-400 hover:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-1 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z * 0.85))}
              title="Zoom Out"
              className="p-2 rounded text-slate-400 hover:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => resetView()}
              title="Fit Sheet to Screen"
              className="p-2 rounded text-slate-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            {/* Grid / Rulers Toggle */}
            <button
              onClick={toggleGrid}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                gridVisible ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              GRID
            </button>
            <button
              onClick={toggleRulers}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                rulersVisible ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              RULERS
            </button>
          </div>

          {/* Alignment Tools (when items selected) */}
          {selectedPartIds.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 animate-in fade-in">
              <button
                onClick={() => alignSelectedParts('left')}
                title="Align Left"
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedParts('right')}
                title="Align Right"
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedParts('top')}
                title="Align Top"
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
              >
                <AlignStartVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedParts('bottom')}
                title="Align Bottom"
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
              >
                <AlignEndVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TRUE-SHAPE AUTO NESTING CTA */}
          {isNesting ? (
            <div className="flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/50 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 animate-pulse">
              <Zap className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>
                ANALYZING... ({nestingProgress?.generation || 1}/{nestingProgress?.totalGenerations || 6} | Best: {nestingProgress?.bestUtilization || 0}%)
              </span>
              <button
                onClick={cancelAutoNesting}
                className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                title="Cancel Nesting"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => startAutoNesting()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-xs font-mono font-extrabold rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              ⚡ START AUTO NEST
            </button>
          )}
        </div>
      )}

      {/* Right Score & Actions */}
      <div className="flex items-center gap-3">
        {/* Streak Badge */}
        <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg text-[11px] font-mono font-bold text-amber-400" title="Daily Optimization Streak">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          {streakDays} DAYS
        </div>

        {/* Real-time score indicator */}
        <button
          onClick={() => setScoreBreakdownModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1 bg-slate-950 hover:bg-slate-800 transition-colors rounded-lg border border-slate-800 text-left"
          title="Click to view explainable score breakdown"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">SCORE:</span>
          <span className="text-sm font-extrabold font-mono text-emerald-400">
            {scoreData.score} / 100
          </span>
        </button>

        {/* Quick Toolbar Modals */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <button
            onClick={() => setProjectsModalOpen(true)}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Projects Manager"
          >
            <Folder className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMaterialsModalOpen(true)}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Material Presets Library"
          >
            <Package className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts"
          >
            <Command className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOnboardingModalOpen(true)}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Quick Onboarding Tour"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Export SVG */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-lg shadow-md shadow-cyan-950/40 transition-all border border-cyan-500/30"
        >
          <Download className="w-4 h-4" />
          EXPORT SVG
        </button>
      </div>
    </header>
  );
};

