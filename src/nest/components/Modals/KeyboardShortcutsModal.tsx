import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Command, X } from 'lucide-react';

export function KeyboardShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useNestStore();

  if (!shortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'Cmd/Ctrl + Z', action: 'Undo last layout edit' },
    { key: 'Cmd/Ctrl + Shift + Z', action: 'Redo previously undone action' },
    { key: 'Cmd/Ctrl + A', action: 'Select all parts on canvas' },
    { key: 'Delete / Backspace', action: 'Delete currently selected parts' },
    { key: 'Escape', action: 'Deselect all active selections / Close modal' },
    { key: 'R', action: 'Rotate selected part 90° CW' },
    { key: 'L', action: 'Toggle Lock position for selected parts' },
    { key: 'Cmd/Ctrl + S', action: 'Save current project layout' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Rapid productivity hotkeys for laser workspace</p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 space-y-2.5">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between"
            >
              <span className="text-xs text-slate-300 font-medium">{sc.action}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold rounded-lg shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
