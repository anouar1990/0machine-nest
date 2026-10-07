'use client';

import React, { useRef, useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { SvgImporter } from '../../core/svg/importer';
import {
  UploadCloud,
  Zap,
  RotateCw,
  Copy,
  Lock,
  Unlock,
  Trash2,
  Undo,
  Download,
  Sparkles,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';

export const MinimalistToolPalette: React.FC = () => {
  const {
    parts,
    selectedPartIds,
    addImportedDesign,
    removeParts,
    duplicateParts,
    rotatePart,
    toggleLockPart,
    undo,
    canUndo,
    isNesting,
    startAutoNesting,
    setExportModalOpen,
  } = useNestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importer = new SvgImporter();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelperTooltip, setShowHelperTooltip] = useState(false);

  const selectedParts = parts.filter((p) => selectedPartIds.includes(p.id));
  const hasSelection = selectedParts.length > 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (importer.canImport(file)) {
        const result = await importer.import(file);
        if (result.parts && result.parts.length > 0) {
          addImportedDesign(result);
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none animate-in slide-in-from-bottom-4 duration-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Helper Guidance Banner for Workshop Operators */}
      {showHelperTooltip && (
        <div className="mb-2 px-4 py-2 bg-cyan-950/95 border-2 border-cyan-400/80 rounded-xl text-cyan-200 font-mono text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {hasSelection
              ? `SELECTED: ${selectedParts[0]?.name || 'Design'} — Use Rotate, Copy, or Lock below.`
              : 'TIP: Click any design on the sheet to select it, or click "IMPORT SVG" to add new designs.'}
          </span>
          <button
            onClick={() => setShowHelperTooltip(false)}
            className="text-cyan-400 hover:text-white text-xs font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Minimalist Floating Tool Deck */}
      <div className="bg-slate-900/95 border-2 border-slate-700/80 hover:border-cyan-500/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl p-2 flex items-center gap-2 transition-all">
        {/* Simple Operator Badge / Toggle */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? 'Expand Quick Toolbar' : 'Minimize Quick Toolbar'}
          className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">QUICK DOCK</span>
        </button>

        {!isMinimized && (
          <>
            <div className="w-px h-7 bg-slate-800 mx-0.5" />

            {/* 1. IMPORT SVG BUTTON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 hover:text-cyan-300 rounded-xl border border-slate-700 hover:border-cyan-500/50 text-xs font-mono font-bold shadow transition-all active:scale-95"
              title="Import SVG File from computer"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>IMPORT</span>
            </button>

            {/* 2. AUTO NEST BUTTON */}
            <button
              onClick={() => startAutoNesting()}
              disabled={isNesting || parts.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-mono font-black shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              title="Automatically optimize and nest all designs on sheet"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isNesting ? 'NESTING...' : 'AUTO NEST'}</span>
            </button>

            <div className="w-px h-7 bg-slate-800 mx-0.5" />

            {/* SELECTION-DEPENDENT ACTIONS */}
            <div
              className={`flex items-center gap-1.5 transition-opacity ${
                hasSelection ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}
            >
              {/* 3. ROTATE BUTTON */}
              <button
                onClick={() => selectedPartIds.forEach((id) => rotatePart(id))}
                disabled={!hasSelection}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold transition-all"
                title="Rotate selected design 90 degrees"
              >
                <RotateCw className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">ROTATE 90°</span>
              </button>

              {/* 4. DUPLICATE BUTTON */}
              <button
                onClick={() => duplicateParts(selectedPartIds)}
                disabled={!hasSelection}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold transition-all"
                title="Duplicate selected design"
              >
                <Copy className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">COPY</span>
              </button>

              {/* 5. LOCK / UNLOCK BUTTON */}
              <button
                onClick={() => selectedPartIds.forEach((id) => toggleLockPart(id))}
                disabled={!hasSelection}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                  selectedParts.some((p) => p.locked)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border-slate-800'
                }`}
                title="Lock position during auto-nesting"
              >
                {selectedParts.some((p) => p.locked) ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">LOCKED</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-slate-400" />
                    <span className="hidden sm:inline">LOCK</span>
                  </>
                )}
              </button>

              {/* 6. DELETE BUTTON */}
              <button
                onClick={() => removeParts(selectedPartIds)}
                disabled={!hasSelection}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl border border-slate-800 hover:border-red-500/40 text-xs font-mono font-bold transition-all"
                title="Delete selected design"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">DELETE</span>
              </button>
            </div>

            <div className="w-px h-7 bg-slate-800 mx-0.5" />

            {/* 7. UNDO BUTTON */}
            <button
              onClick={() => undo()}
              disabled={!canUndo()}
              className="p-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all"
              title="Undo last operation"
            >
              <Undo className="w-4 h-4" />
            </button>

            {/* 8. EXPORT BUTTON */}
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl border border-cyan-400/30 text-xs font-mono font-black shadow-md transition-all active:scale-95"
              title="Export nested layout as SVG file"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT</span>
            </button>

            {/* HELP GUIDANCE TOGGLE */}
            <button
              onClick={() => setShowHelperTooltip(!showHelperTooltip)}
              className={`p-2 rounded-xl border transition-all ${
                showHelperTooltip
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="Toggle Operator Helper Guidance"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
