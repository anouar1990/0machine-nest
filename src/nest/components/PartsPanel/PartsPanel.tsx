'use client';

import React, { useRef, useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { SvgImporter } from '../../core/svg/importer';
import {
  UploadCloud,
  Plus,
  Minus,
  Copy,
  RotateCw,
  Lock,
  Unlock,
  Trash2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const PartsPanel: React.FC = () => {
  const {
    parts,
    selectedPartIds,
    addImportedDesign,
    removeParts,
    duplicateParts,
    updatePartQuantity,
    rotatePart,
    toggleLockPart,
    selectPart,
    clearAllParts,
  } = useNestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const importer = new SvgImporter();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setWarningMessage(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (importer.canImport(file)) {
        const result = await importer.import(file);
        if (result.errors && result.errors.length > 0) {
          setErrorMessage(result.errors.join('\n\n'));
        } else {
          addImportedDesign(result);
          if (result.warnings && result.warnings.length > 0) {
            setWarningMessage(result.warnings.join(' '));
          }
        }
      } else {
        setErrorMessage(`Unsupported file format. Please upload valid SVG files.`);
      }
    }
  };

  return (
    <aside className="w-80 h-full bg-slate-900/90 border-r border-slate-800 flex flex-col z-10 backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            PARTS LIBRARY ({parts.length})
          </h2>
        </div>
        {parts.length > 0 && (
          <button
            onClick={clearAllParts}
            className="text-[11px] font-mono text-slate-400 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* SVG Drag and Drop Dropzone */}
      <div className="p-4 border-b border-slate-800">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <UploadCloud className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-200 font-mono">
            DROP SVG FILES HERE
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            or click to browse from computer
          </p>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-mono text-red-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              Import Error
            </div>
            <p className="text-[11px] whitespace-pre-line text-slate-300">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Warning Alert Display */}
        {warningMessage && (
          <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] font-mono text-amber-400">
            {warningMessage}
          </div>
        )}
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {parts.length === 0 ? (
          <div className="text-center py-12 space-y-2 text-slate-500 font-mono">
            <FileText className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs">No SVG parts uploaded yet.</p>
          </div>
        ) : (
          parts.map((part) => {
            const isSelected = selectedPartIds.includes(part.id);
            return (
              <div
                key={part.id}
                onClick={() => selectPart(part.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: part.color || '#00f0ff' }}
                    />
                    <h3 className="text-xs font-bold text-white font-mono truncate">
                      {part.name}
                    </h3>
                  </div>

                  {/* Quantity Controller */}
                  <div
                    className="flex items-center bg-slate-900 border border-slate-800 rounded shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => updatePartQuantity(part.id, part.quantity - 1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold text-cyan-400">
                      {part.quantity}
                    </span>
                    <button
                      onClick={() => updatePartQuantity(part.id, part.quantity + 1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>
                    Dim: {part.width.toFixed(1)} × {part.height.toFixed(1)} mm
                  </span>
                  <span>Area: {(part.area / 100).toFixed(1)} cm²</span>
                </div>

                {/* Part Action Tools */}
                <div
                  className="flex items-center justify-end gap-1 pt-1 border-t border-slate-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => rotatePart(part.id)}
                    title="Rotate 90°"
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => duplicateParts([part.id])}
                    title="Duplicate Part"
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLockPart(part.id)}
                    title={part.locked ? 'Unlock Position' : 'Lock Position'}
                    className={`p-1 rounded transition-colors ${
                      part.locked
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {part.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => removeParts([part.id])}
                    title="Delete Part"
                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-900"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
