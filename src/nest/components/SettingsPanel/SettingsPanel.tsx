'use client';

import React from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Sliders, Box, Euro, Layers } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { sheet, updateSheet } = useNestStore();

  return (
    <aside className="w-72 h-full bg-slate-900/90 border-l border-slate-800 flex flex-col z-10 backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <Sliders className="w-4 h-4 text-cyan-400" />
        <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
          SHEET PARAMETERS
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Sheet Dimensions */}
        <div className="space-y-3">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            STOCK DIMENSIONS (MM)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1">
                WIDTH (X)
              </span>
              <input
                type="number"
                value={sheet.width}
                onChange={(e) =>
                  updateSheet({ width: Math.max(50, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1">
                HEIGHT (Y)
              </span>
              <input
                type="number"
                value={sheet.height}
                onChange={(e) =>
                  updateSheet({ height: Math.max(50, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Manufacturing Offsets */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            CUTTING OFFSETS (MM)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1">
                MARGIN (EDGE)
              </span>
              <input
                type="number"
                value={sheet.margin}
                onChange={(e) =>
                  updateSheet({ margin: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1">
                PART SPACING
              </span>
              <input
                type="number"
                value={sheet.spacing}
                onChange={(e) =>
                  updateSheet({ spacing: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Material Specs */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-amber-400" />
            MATERIAL COST SPECS
          </label>

          <div className="space-y-3">
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1">
                MATERIAL NAME
              </span>
              <input
                type="text"
                value={sheet.materialName || ''}
                onChange={(e) => updateSheet({ materialName: e.target.value })}
                placeholder="e.g. Baltic Birch Plywood 3mm"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1">
                PRICE PER SHEET (€)
              </span>
              <input
                type="number"
                step="0.5"
                value={sheet.materialPricePerSheet || 15}
                onChange={(e) =>
                  updateSheet({
                    materialPricePerSheet: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
