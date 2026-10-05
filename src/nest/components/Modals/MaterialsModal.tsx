import React, { useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { Package, Plus, Trash2, Check, X, Layers } from 'lucide-react';

export function MaterialsModal() {
  const {
    materialsModalOpen,
    setMaterialsModalOpen,
    materialPresets,
    activeMaterialPresetId,
    selectMaterialPreset,
    addMaterialPreset,
    deleteMaterialPreset,
  } = useNestStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newThickness, setNewThickness] = useState(3.0);
  const [newWidth, setNewWidth] = useState(600);
  const [newHeight, setNewHeight] = useState(300);
  const [newPrice, setNewPrice] = useState(15.0);
  const newCurrency = 'EUR';

  if (!materialsModalOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addMaterialPreset({
      name: newName.trim(),
      thicknessMm: Number(newThickness),
      widthMm: Number(newWidth),
      heightMm: Number(newHeight),
      pricePerSheet: Number(newPrice),
      currency: newCurrency,
    });

    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Material Presets Library</h2>
              <p className="text-xs text-slate-400">Configure raw stock dimensions & material costs</p>
            </div>
          </div>
          <button
            onClick={() => setMaterialsModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {materialPresets.length} Material Presets Available
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? 'Cancel' : 'Add Material'}
            </button>
          </div>

          {/* Add Preset Form */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-cyan-400">Add New Raw Stock Preset</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Material Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baltic Birch Plywood 4mm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newThickness}
                    onChange={(e) => setNewThickness(parseFloat(e.target.value))}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Width (mm)</label>
                  <input
                    type="number"
                    value={newWidth}
                    onChange={(e) => setNewWidth(parseFloat(e.target.value))}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Height (mm)</label>
                  <input
                    type="number"
                    value={newHeight}
                    onChange={(e) => setNewHeight(parseFloat(e.target.value))}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Price per Sheet (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition-all"
              >
                Save Material Preset
              </button>
            </form>
          )}

          {/* Preset Cards List */}
          <div className="space-y-2">
            {materialPresets.map((mat) => {
              const isSelected = mat.id === activeMaterialPresetId;
              return (
                <div
                  key={mat.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{mat.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {mat.thicknessMm}mm
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {mat.widthMm} × {mat.heightMm} mm
                      </span>
                      <span className="font-semibold text-emerald-400">
                        €{mat.pricePerSheet.toFixed(2)} / sheet
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectMaterialPreset(mat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {isSelected ? 'Active' : 'Apply'}
                    </button>
                    {materialPresets.length > 1 && (
                      <button
                        onClick={() => deleteMaterialPreset(mat.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
