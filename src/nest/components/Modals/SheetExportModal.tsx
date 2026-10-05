import React, { useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { validatePreExport } from '../../export/exportValidation';
import { exportSheetToSvg, exportAllSheetsToSvg, downloadSvgFile } from '../../export/svgExporter';
import { analyticsService } from '../../analytics/analyticsService';
import { Download, AlertTriangle, CheckCircle2, ShieldAlert, Layers, X } from 'lucide-react';

export function SheetExportModal() {
  const { exportModalOpen, setExportModalOpen, parts, sheet, sheets, currentProjectName } = useNestStore();
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);

  if (!exportModalOpen) return null;

  const validation = validatePreExport(parts, sheet, sheets);
  const activeSheetObj = sheets[selectedSheetIdx] || sheet;
  const activeSheetParts = parts.filter((p) => (p.sheetIndex || 0) === selectedSheetIdx);

  const handleExportSingle = () => {
    const svgContent = exportSheetToSvg(activeSheetParts, activeSheetObj);
    const filename = `${currentProjectName.replace(/\s+/g, '_')}_sheet_${selectedSheetIdx + 1}.svg`;
    downloadSvgFile(filename, svgContent);
    analyticsService.trackEvent('export_svg', { type: 'single_sheet', sheetIndex: selectedSheetIdx });
  };

  const handleExportAll = () => {
    const svgContent = exportAllSheetsToSvg(parts, sheets);
    const filename = `${currentProjectName.replace(/\s+/g, '_')}_all_sheets.svg`;
    downloadSvgFile(filename, svgContent);
    analyticsService.trackEvent('export_svg', { type: 'all_sheets', totalSheets: sheets.length });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">SVG Production Export & Preview</h2>
              <p className="text-xs text-slate-400">Pre-flight layout validation & vector export for Laser / CNC</p>
            </div>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Validation Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              validation.isValid
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            {validation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {validation.isValid ? 'Pre-Export Layout Validation Passed' : 'Export Blocked — Fix Layout Errors'}
              </h4>
              {validation.isValid ? (
                <p className="text-xs text-emerald-300/80">
                  Layout is clean. No overlapping parts or sheet boundary breaches detected. Ready for cutting.
                </p>
              ) : (
                <ul className="text-xs space-y-1 list-disc list-inside text-rose-200">
                  {validation.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}

              {validation.warnings.length > 0 && (
                <div className="mt-2 text-xs text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{validation.warnings.join(' ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Job Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Sheets</span>
              <p className="text-xl font-extrabold text-white mt-0.5">{sheets.length}</p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Parts</span>
              <p className="text-xl font-extrabold text-white mt-0.5">{parts.length}</p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sheet Dimensions</span>
              <p className="text-xl font-extrabold text-cyan-400 mt-0.5">{sheet.width}x{sheet.height}mm</p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Part Spacing</span>
              <p className="text-xl font-extrabold text-cyan-400 mt-0.5">{sheet.spacing}mm</p>
            </div>
          </div>

          {/* Sheet Selector Tabs */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {sheets.map((sh, idx) => (
                <button
                  key={sh.id}
                  onClick={() => setSelectedSheetIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    selectedSheetIdx === idx
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Sheet #{idx + 1} ({parts.filter((p) => (p.sheetIndex || 0) === idx).length} parts)
                </button>
              ))}
            </div>
          )}

          {/* SVG Canvas Interactive Preview Container */}
          <div className="p-4 bg-[#05070c] border border-cyan-950/60 rounded-xl flex flex-col items-center justify-center min-h-[220px]">
            <span className="text-[11px] font-semibold text-slate-400 mb-2">
              Previewing Sheet #{selectedSheetIdx + 1} ({activeSheetParts.length} nested parts)
            </span>
            <div
              className="w-full max-h-[280px] overflow-auto flex justify-center p-2"
              dangerouslySetInnerHTML={{
                __html: exportSheetToSvg(activeSheetParts, activeSheetObj),
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1322] flex items-center justify-between">
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {sheets.length > 1 && (
              <button
                onClick={handleExportAll}
                disabled={!validation.isValid}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export All Sheets SVG
              </button>
            )}
            <button
              onClick={handleExportSingle}
              disabled={!validation.isValid}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              Export Sheet #{selectedSheetIdx + 1} SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
