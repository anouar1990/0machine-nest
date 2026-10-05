import { useEffect } from 'react';
import { useNestStore } from '../state/useNestStore';

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    selectAllParts,
    clearSelection,
    selectedPartIds,
    removeParts,
    rotatePart,
    toggleLockPart,
    activeTab,
    saveCurrentProject,
  } = useNestStore();

  useEffect(() => {
    if (activeTab !== 'workspace') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keybindings when user is typing inside text inputs, textareas or contenteditables
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z (Undo) / Ctrl/Cmd + Shift + Z or Cmd + Y (Redo)
      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + S (Manual Save Project)
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentProject();
        return;
      }

      // Ctrl/Cmd + A (Select All)
      if (cmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllParts();
        return;
      }

      // Escape (Deselect All)
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Delete / Backspace (Delete Selected Parts)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPartIds.length > 0) {
          e.preventDefault();
          removeParts(selectedPartIds);
        }
        return;
      }

      // R (Rotate 90° for first selected part)
      if (e.key.toLowerCase() === 'r' && !cmdOrCtrl) {
        if (selectedPartIds.length > 0) {
          e.preventDefault();
          selectedPartIds.forEach((id) => rotatePart(id));
        }
        return;
      }

      // L (Toggle Lock for selected parts)
      if (e.key.toLowerCase() === 'l' && !cmdOrCtrl) {
        if (selectedPartIds.length > 0) {
          e.preventDefault();
          selectedPartIds.forEach((id) => toggleLockPart(id));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    undo,
    redo,
    selectAllParts,
    clearSelection,
    selectedPartIds,
    removeParts,
    rotatePart,
    toggleLockPart,
    saveCurrentProject,
  ]);
}
