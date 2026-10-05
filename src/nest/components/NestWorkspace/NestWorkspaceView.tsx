'use client';

import React, { useEffect } from 'react';
import { PartsPanel } from '../PartsPanel/PartsPanel';
import { SheetCanvas } from '../SheetCanvas/SheetCanvas';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import { ScoreCard } from '../ScoreCard/ScoreCard';
import { ComparisonModal } from '../ComparisonModal/ComparisonModal';
import { useNestStore } from '../../state/useNestStore';

export const NestWorkspaceView: React.FC = () => {
  const {
    undo,
    redo,
    removeParts,
    selectedPartIds,
    rotatePart,
    optimizationComparison,
    clearComparison,
  } = useNestStore();

  // Keyboard shortcut listeners (Ctrl+Z, Ctrl+Shift+Z, Delete, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPartIds.length > 0) {
          e.preventDefault();
          removeParts(selectedPartIds);
        }
      } else if (e.key.toLowerCase() === 'r') {
        if (selectedPartIds.length > 0) {
          e.preventDefault();
          selectedPartIds.forEach((id) => rotatePart(id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, removeParts, selectedPartIds, rotatePart]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#07090e]">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Parts Library Panel */}
        <PartsPanel />

        {/* Center Sheet Canvas Renderer */}
        <SheetCanvas />

        {/* Right Settings Parameters Panel */}
        <SettingsPanel />
      </div>

      {/* Footer Real-time Score Bar */}
      <ScoreCard />

      {/* Before vs After Optimization Comparison Modal */}
      {optimizationComparison && (
        <ComparisonModal
          comparison={optimizationComparison}
          onClose={clearComparison}
          onApply={clearComparison}
        />
      )}
    </div>
  );
};
