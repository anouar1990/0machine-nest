import { create } from 'zustand';
import {
  Part,
  Sheet,
  NormalizedDesign,
  NestingScore,
  UserStats,
  Mission,
  Achievement,
  SheetLayoutResult,
  OptimizationComparison,
  MaterialPreset,
  WorkshopProfile,
  AutosaveStatus,
} from '../core/types';
import { calculateNestingScore } from '../nesting/scoring';
import { rotateGeometry } from '../core/geometry';
import { nestingService } from '../nesting/worker/nestingService';
import { projectService } from '../services/projectService';
import { autosaveEngine } from '../services/autosaveEngine';
import { analyticsService } from '../analytics/analyticsService';

export type ActiveTab = 'dashboard' | 'workspace';

type HistorySnapshot = {
  sheet: Sheet;
  parts: Part[];
  sheets: Sheet[];
};

interface NestState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Sheet configuration
  sheet: Sheet;
  sheets: Sheet[];
  activeSheetIndex: number;
  setActiveSheetIndex: (index: number) => void;
  updateSheet: (settings: Partial<Sheet>) => void;
  addSheet: () => void;
  removeSheet: (index: number) => void;

  // Parts list
  parts: Part[];
  selectedPartIds: string[];

  // True-Shape Optimization State
  isNesting: boolean;
  nestingProgress: {
    generation: number;
    totalGenerations: number;
    bestUtilization: number;
    currentStrategy: string;
  } | null;
  multiSheetResults: SheetLayoutResult[];
  optimizationComparison: OptimizationComparison | null;
  clearComparison: () => void;
  startAutoNesting: () => Promise<void>;
  cancelAutoNesting: () => void;

  // Canvas View Controls
  zoom: number;
  pan: { x: number; y: number };
  gridVisible: boolean;
  rulersVisible: boolean;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  resetView: () => void;

  // History (Undo / Redo)
  history: HistorySnapshot[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Part Operations
  addImportedDesign: (design: NormalizedDesign) => void;
  removeParts: (ids: string[]) => void;
  duplicateParts: (ids: string[]) => void;
  updatePartQuantity: (id: string, qty: number) => void;
  movePart: (id: string, x: number, y: number) => void;
  rotatePart: (id: string) => void;
  toggleLockPart: (id: string) => void;
  selectPart: (id: string, multi?: boolean) => void;
  selectAllParts: () => void;
  clearSelection: () => void;
  alignSelectedParts: (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-x' | 'center-y') => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  clearAllParts: () => void;

  // Project Persistence & Autosave
  currentProjectId?: string;
  currentProjectName: string;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: string | null;
  createNewProject: () => void;
  loadProject: (id: string) => void;
  saveCurrentProject: () => Promise<void>;
  duplicateProjectById: (id: string) => void;
  deleteProjectById: (id: string) => void;
  renameCurrentProject: (newName: string) => void;

  // Material Presets & Workshop Profile
  materialPresets: MaterialPreset[];
  activeMaterialPresetId?: string;
  workshopProfile: WorkshopProfile;
  addMaterialPreset: (preset: Omit<MaterialPreset, 'id'>) => void;
  deleteMaterialPreset: (id: string) => void;
  selectMaterialPreset: (id: string) => void;
  updateWorkshopProfile: (profile: Partial<WorkshopProfile>) => void;

  // Gamification & User Stats
  userStats: UserStats;
  missions: Mission[];
  achievements: Achievement[];
  streakDays: number;

  // Modals UI state
  scoreBreakdownModalOpen: boolean;
  exportModalOpen: boolean;
  shortcutsModalOpen: boolean;
  projectsModalOpen: boolean;
  materialsModalOpen: boolean;
  onboardingModalOpen: boolean;
  setScoreBreakdownModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setProjectsModalOpen: (open: boolean) => void;
  setMaterialsModalOpen: (open: boolean) => void;
  setOnboardingModalOpen: (open: boolean) => void;

  // Real-time calculation helpers
  getScore: () => NestingScore;
}

const DEFAULT_SHEET: Sheet = {
  id: 'default-sheet-1',
  name: 'Standard Baltic Birch 600x300',
  width: 600,
  height: 300,
  margin: 5,
  spacing: 3,
  materialName: 'Plywood 3mm',
  materialPricePerSheet: 15.0,
};

const INITIAL_USER_STATS: UserStats = {
  score: 94,
  level: 12,
  levelTitle: 'Workshop Optimizer',
  xp: 7450,
  xpToNextLevel: 10000,
  jobsCompleted: 127,
  sheetsOptimized: 48,
  totalMaterialSavedEur: 84.5,
  averageWastePercentage: 6.2,
  personalRecords: {
    bestUtilization: 96.8,
    lowestWaste: 3.2,
    mostParts: 184,
    mostMaterialSavedEur: 42.7,
    fastestNestSec: 11.4,
  },
};

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: '🔥 Beat your personal best',
    description: 'Achieve a nesting score higher than 94 points.',
    rewardXp: 300,
    progress: 94,
    completed: false,
    type: 'score',
    targetValue: 97,
    currentValue: 94,
  },
  {
    id: 'm2',
    title: 'Daily Challenge: Waste Hunter',
    description: 'Keep material waste below 8% on your current sheet.',
    rewardXp: 250,
    progress: 75,
    completed: false,
    type: 'waste',
    targetValue: 8,
    currentValue: 6.2,
  },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a1',
    title: 'FIRST NEST',
    description: 'Completed your first nesting layout optimization',
    iconName: 'Zap',
    unlocked: true,
    unlockedAt: '2026-09-15',
  },
  {
    id: 'a2',
    title: 'WASTE HUNTER',
    description: 'Achieved less than 5% waste on a production sheet',
    iconName: 'Target',
    unlocked: true,
    unlockedAt: '2026-09-28',
  },
  {
    id: 'a3',
    title: 'MATERIAL MASTER',
    description: 'Saved over €100 worth of raw material stock',
    iconName: 'Award',
    unlocked: false,
  },
  {
    id: 'a4',
    title: 'PERFECT NEST',
    description: 'Achieved 95%+ material utilization on a complex job',
    iconName: 'Trophy',
    unlocked: true,
    unlockedAt: '2026-10-01',
  },
  {
    id: 'a5',
    title: '100 PARTS',
    description: 'Successfully nested over 100 cut parts',
    iconName: 'Layers',
    unlocked: true,
    unlockedAt: '2026-10-03',
  },
  {
    id: 'a6',
    title: '500 PARTS',
    description: 'Successfully nested over 500 cut parts',
    iconName: 'Layers',
    unlocked: false,
  },
];

const DEFAULT_MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'mat-birch-3mm',
    name: 'Baltic Birch Plywood 3mm',
    thicknessMm: 3.0,
    widthMm: 600,
    heightMm: 300,
    pricePerSheet: 15.0,
    currency: 'EUR',
  },
  {
    id: 'mat-birch-6mm',
    name: 'Baltic Birch Plywood 6mm',
    thicknessMm: 6.0,
    widthMm: 1200,
    heightMm: 600,
    pricePerSheet: 28.0,
    currency: 'EUR',
  },
  {
    id: 'mat-mdf-6mm',
    name: 'MDF Board 6mm',
    thicknessMm: 6.0,
    widthMm: 1200,
    heightMm: 600,
    pricePerSheet: 24.0,
    currency: 'EUR',
  },
  {
    id: 'mat-acrylic-3mm',
    name: 'Clear Acrylic 3mm',
    thicknessMm: 3.0,
    widthMm: 600,
    heightMm: 400,
    pricePerSheet: 18.0,
    currency: 'EUR',
  },
  {
    id: 'mat-alum-15mm',
    name: 'Aluminum 5052 1.5mm',
    thicknessMm: 1.5,
    widthMm: 500,
    heightMm: 500,
    pricePerSheet: 32.0,
    currency: 'EUR',
  },
];

const DEFAULT_WORKSHOP_PROFILE: WorkshopProfile = {
  workshopName: '0Machine CNC & Laser Workshop #1',
  defaultMaterialId: 'mat-birch-3mm',
  defaultSheetWidth: 600,
  defaultSheetHeight: 300,
  defaultSpacing: 3,
  defaultMargin: 5,
  currency: 'EUR',
};

const SAMPLE_PART_GEOMETRY = {
  contours: [
    [
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 60, y: 40 },
      { x: 40, y: 40 },
      { x: 40, y: 60 },
      { x: 0, y: 60 },
      { x: 0, y: 0 },
    ],
  ],
  holes: [
    [
      { x: 15, y: 15 },
      { x: 25, y: 15 },
      { x: 25, y: 25 },
      { x: 15, y: 25 },
      { x: 15, y: 15 },
    ],
  ],
  bounds: { minX: 0, minY: 0, maxX: 60, maxY: 60, width: 60, height: 60 },
  area: 2300,
};

const SAMPLE_PARTS: Part[] = [
  {
    id: 'sample-1',
    sourceFileName: 'mounting_bracket.svg',
    name: 'Mounting Bracket A',
    geometry: SAMPLE_PART_GEOMETRY,
    quantity: 4,
    width: 60,
    height: 60,
    area: 2300,
    position: { x: 15, y: 15 },
    rotation: 0,
    locked: false,
    selected: false,
    color: '#00f0ff',
    sheetIndex: 0,
  },
  {
    id: 'sample-2',
    sourceFileName: 'gear_wheel.svg',
    name: 'Gear Wheel 80mm',
    geometry: {
      contours: [
        [
          { x: 0, y: 20 },
          { x: 20, y: 0 },
          { x: 60, y: 0 },
          { x: 80, y: 20 },
          { x: 80, y: 60 },
          { x: 60, y: 80 },
          { x: 20, y: 80 },
          { x: 0, y: 60 },
          { x: 0, y: 20 },
        ],
      ],
      holes: [
        [
          { x: 30, y: 30 },
          { x: 50, y: 30 },
          { x: 50, y: 50 },
          { x: 30, y: 50 },
          { x: 30, y: 30 },
        ],
      ],
      bounds: { minX: 0, minY: 0, maxX: 80, maxY: 80, width: 80, height: 80 },
      area: 5200,
    },
    quantity: 3,
    width: 80,
    height: 80,
    area: 5200,
    position: { x: 85, y: 15 },
    rotation: 0,
    locked: false,
    selected: false,
    color: '#10b981',
    sheetIndex: 0,
  },
];

export const useNestStore = create<NestState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sheet: DEFAULT_SHEET,
  sheets: [DEFAULT_SHEET],
  activeSheetIndex: 0,

  setActiveSheetIndex: (index) =>
    set({ activeSheetIndex: Math.max(0, Math.min(get().sheets.length - 1, index)) }),

  updateSheet: (settings) => {
    const newSheet = { ...get().sheet, ...settings };
    const updatedSheets = [...get().sheets];
    updatedSheets[get().activeSheetIndex] = newSheet;
    set({ sheet: newSheet, sheets: updatedSheets });
    get().pushHistory();
  },

  addSheet: () => {
    const nextIdx = get().sheets.length + 1;
    const newSheet: Sheet = {
      ...get().sheet,
      id: `sheet-${Date.now()}-${nextIdx}`,
      name: `Sheet #${nextIdx} (${get().sheet.width}x${get().sheet.height})`,
    };
    const updated = [...get().sheets, newSheet];
    set({ sheets: updated, activeSheetIndex: updated.length - 1 });
    get().pushHistory();
  },

  removeSheet: (index) => {
    if (get().sheets.length <= 1) return;
    const updated = get().sheets.filter((_, i) => i !== index);
    const nextActive = Math.min(get().activeSheetIndex, updated.length - 1);
    set({ sheets: updated, activeSheetIndex: nextActive, sheet: updated[nextActive] });
    get().pushHistory();
  },

  parts: SAMPLE_PARTS,
  selectedPartIds: [],

  // True-Shape Optimization State
  isNesting: false,
  nestingProgress: null,
  multiSheetResults: [],
  optimizationComparison: null,

  clearComparison: () => set({ optimizationComparison: null }),

  startAutoNesting: async () => {
    const { parts, sheet, getScore } = get();
    if (parts.length === 0) return;

    // Record BEFORE stats
    const beforeScoreData = getScore();
    const beforePricePerSheet = sheet.materialPricePerSheet || 15;
    const beforeCost = beforeScoreData.sheetCount * beforePricePerSheet;

    set({ isNesting: true, nestingProgress: { generation: 1, totalGenerations: 6, bestUtilization: 0, currentStrategy: 'Initializing True-Shape Engine...' } });

    try {
      const resultScoreData = await nestingService.runNestingAsync(
        parts,
        sheet,
        { multiStartCount: 6, rotations: [0, 90, 180, 270] },
        (prog) => set({ nestingProgress: prog })
      );

      // Multi-sheet allocation result handling
      let finalSheets = get().sheets;
      if (resultScoreData.sheetCount > get().sheets.length) {
        finalSheets = Array.from({ length: resultScoreData.sheetCount }).map((_, i) => ({
          ...sheet,
          id: `sheet_auto_${i + 1}`,
          name: `Sheet #${i + 1}`,
        }));
      }

      // Record AFTER stats
      const afterCost = resultScoreData.sheetCount * beforePricePerSheet;

      const comparison: OptimizationComparison = {
        before: {
          sheetCount: beforeScoreData.sheetCount,
          utilizationPercentage: beforeScoreData.utilizationPercentage,
          wastePercentage: beforeScoreData.wastePercentage,
          totalMaterialCostEur: beforeCost,
        },
        after: {
          sheetCount: resultScoreData.sheetCount,
          utilizationPercentage: resultScoreData.utilizationPercentage,
          wastePercentage: resultScoreData.wastePercentage,
          totalMaterialCostEur: afterCost,
        },
        saved: {
          sheetsSaved: Math.max(0, beforeScoreData.sheetCount - resultScoreData.sheetCount),
          wasteReducedPercentage: parseFloat(
            Math.max(0, beforeScoreData.wastePercentage - resultScoreData.wastePercentage).toFixed(1)
          ),
          costSavedEur: Math.max(0, beforeCost - afterCost),
        },
      };

      // Extract all optimized parts layout
      const optimizedParts = resultScoreData.sheetResults.flatMap((sr) => sr.parts);

      set({
        parts: optimizedParts.length > 0 ? optimizedParts : parts,
        sheets: finalSheets,
        multiSheetResults: resultScoreData.sheetResults,
        isNesting: false,
        nestingProgress: null,
        optimizationComparison: comparison,
      });

      // Update Gamification XP & Records
      const currentStats = get().userStats;
      const newXp = currentStats.xp + 250;
      const newLevel = newXp >= currentStats.xpToNextLevel ? currentStats.level + 1 : currentStats.level;

      set({
        userStats: {
          ...currentStats,
          score: Math.max(currentStats.score, resultScoreData.score),
          level: newLevel,
          xp: newXp,
          jobsCompleted: currentStats.jobsCompleted + 1,
          sheetsOptimized: currentStats.sheetsOptimized + resultScoreData.sheetCount,
          totalMaterialSavedEur: parseFloat((currentStats.totalMaterialSavedEur + comparison.saved.costSavedEur).toFixed(2)),
          averageWastePercentage: parseFloat(((currentStats.averageWastePercentage + resultScoreData.wastePercentage) / 2).toFixed(1)),
          personalRecords: {
            ...currentStats.personalRecords,
            bestUtilization: Math.max(currentStats.personalRecords.bestUtilization, resultScoreData.utilizationPercentage),
            lowestWaste: Math.min(currentStats.personalRecords.lowestWaste, resultScoreData.wastePercentage),
            mostMaterialSavedEur: Math.max(currentStats.personalRecords.mostMaterialSavedEur, comparison.saved.costSavedEur),
          },
        },
      });

      get().pushHistory();
    } catch {
      set({ isNesting: false, nestingProgress: null });
    }
  },

  cancelAutoNesting: () => {
    nestingService.cancel();
    set({ isNesting: false, nestingProgress: null });
  },

  zoom: 1.0,
  pan: { x: 0, y: 0 },
  gridVisible: true,
  rulersVisible: true,

  setZoom: (zoom) =>
    set((state) => ({
      zoom: typeof zoom === 'function' ? zoom(state.zoom) : zoom,
    })),
  setPan: (pan) =>
    set((state) => ({
      pan: typeof pan === 'function' ? pan(state.pan) : pan,
    })),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  toggleRulers: () => set((state) => ({ rulersVisible: !state.rulersVisible })),
  resetView: () => set({ zoom: 1.0, pan: { x: 0, y: 0 } }),

  history: [{ sheet: DEFAULT_SHEET, sheets: [DEFAULT_SHEET], parts: SAMPLE_PARTS }],
  historyIndex: 0,

  pushHistory: () => {
    const { sheet, sheets, parts, history, historyIndex, currentProjectId, currentProjectName, getScore, activeMaterialPresetId } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      sheet,
      sheets: JSON.parse(JSON.stringify(sheets)),
      parts: JSON.parse(JSON.stringify(parts)),
    });
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // Schedule debounced autosave
    autosaveEngine.scheduleAutosave(
      currentProjectId,
      currentProjectName,
      sheet,
      sheets,
      parts,
      getScore().score,
      activeMaterialPresetId,
      (status, savedProj) => {
        set({
          autosaveStatus: status,
          ...(savedProj ? { currentProjectId: savedProj.id, lastSavedAt: savedProj.updatedAt } : {}),
        });
      }
    );
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        sheet: prev.sheet,
        sheets: prev.sheets || [prev.sheet],
        parts: JSON.parse(JSON.stringify(prev.parts)),
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        sheet: next.sheet,
        sheets: next.sheets || [next.sheet],
        parts: JSON.parse(JSON.stringify(next.parts)),
        historyIndex: historyIndex + 1,
      });
    }
  },

  addImportedDesign: (design) => {
    if (!design || !design.parts || design.parts.length === 0) return;

    const colors = ['#00f0ff', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

    const newParts: Part[] = design.parts.map((item, idx) => ({
      id: `part_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      sourceFileName: design.fileName,
      name: item.name || `${design.fileName.replace(/\.svg$/i, '')} #${idx + 1}`,
      geometry: item.geometry,
      quantity: 1,
      width: item.width,
      height: item.height,
      area: item.area,
      position: { x: 10 + idx * 20, y: 10 + idx * 20 },
      rotation: 0,
      locked: false,
      selected: false,
      color: colors[idx % colors.length],
      sheetIndex: get().activeSheetIndex,
    }));

    const updatedParts = [...get().parts, ...newParts];
    set({ parts: updatedParts });
    get().pushHistory();
  },

  removeParts: (ids) => {
    if (!ids || ids.length === 0) return;
    const setIds = new Set(ids);
    const updated = get().parts.filter((p) => !setIds.has(p.id));
    set({
      parts: updated,
      selectedPartIds: get().selectedPartIds.filter((id) => !setIds.has(id)),
    });
    get().pushHistory();
  },

  duplicateParts: (ids) => {
    if (!ids || ids.length === 0) return;
    const setIds = new Set(ids);
    const duplicates: Part[] = [];

    get().parts.forEach((p) => {
      if (setIds.has(p.id)) {
        duplicates.push({
          ...JSON.parse(JSON.stringify(p)),
          id: `part_${Date.now()}_dup_${Math.random().toString(36).substring(2, 6)}`,
          name: `${p.name} (Copy)`,
          position: { x: p.position.x + 10, y: p.position.y + 10 },
          selected: true,
        });
      }
    });

    const updated = [...get().parts, ...duplicates];
    set({
      parts: updated,
      selectedPartIds: duplicates.map((d) => d.id),
    });
    get().pushHistory();
  },

  updatePartQuantity: (id, qty) => {
    const safeQty = Math.max(1, qty);
    const updated = get().parts.map((p) => (p.id === id ? { ...p, quantity: safeQty } : p));
    set({ parts: updated });
    get().pushHistory();
  },

  movePart: (id, x, y) => {
    const updated = get().parts.map((p) => {
      if (p.id === id && !p.locked) {
        return {
          ...p,
          position: {
            x: Math.max(0, x),
            y: Math.max(0, y),
          },
        };
      }
      return p;
    });
    set({ parts: updated });
  },

  rotatePart: (id) => {
    const updated = get().parts.map((p) => {
      if (p.id === id && !p.locked) {
        const nextRot = (p.rotation + 90) % 360;
        const newGeom = rotateGeometry(p.geometry, 90);
        return {
          ...p,
          rotation: nextRot,
          geometry: newGeom,
          width: newGeom.bounds.width,
          height: newGeom.bounds.height,
        };
      }
      return p;
    });
    set({ parts: updated });
    get().pushHistory();
  },

  toggleLockPart: (id) => {
    const updated = get().parts.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p));
    set({ parts: updated });
    get().pushHistory();
  },

  selectPart: (id, multi = false) => {
    if (multi) {
      const exists = get().selectedPartIds.includes(id);
      const updated = exists
        ? get().selectedPartIds.filter((item) => item !== id)
        : [...get().selectedPartIds, id];
      set({ selectedPartIds: updated });
    } else {
      set({ selectedPartIds: [id] });
    }
  },

  selectAllParts: () => {
    set({ selectedPartIds: get().parts.map((p) => p.id) });
  },

  clearSelection: () => {
    set({ selectedPartIds: [] });
  },

  alignSelectedParts: (alignment) => {
    const { selectedPartIds, parts, sheet } = get();
    if (selectedPartIds.length === 0) return;

    const selectedParts = parts.filter((p) => selectedPartIds.includes(p.id));
    const margin = sheet.margin || 5;

    let targetVal = 0;
    if (alignment === 'left') targetVal = margin;
    if (alignment === 'top') targetVal = margin;
    if (alignment === 'right')
      targetVal = sheet.width - margin - Math.max(...selectedParts.map((p) => p.width));
    if (alignment === 'bottom')
      targetVal = sheet.height - margin - Math.max(...selectedParts.map((p) => p.height));

    const updated = parts.map((p) => {
      if (selectedPartIds.includes(p.id) && !p.locked) {
        if (alignment === 'left' || alignment === 'right') return { ...p, position: { ...p.position, x: targetVal } };
        if (alignment === 'top' || alignment === 'bottom') return { ...p, position: { ...p.position, y: targetVal } };
      }
      return p;
    });

    set({ parts: updated });
    get().pushHistory();
  },

  bringForward: (id) => {
    const idx = get().parts.findIndex((p) => p.id === id);
    if (idx < get().parts.length - 1) {
      const updated = [...get().parts];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      set({ parts: updated });
      get().pushHistory();
    }
  },

  sendBackward: (id) => {
    const idx = get().parts.findIndex((p) => p.id === id);
    if (idx > 0) {
      const updated = [...get().parts];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      set({ parts: updated });
      get().pushHistory();
    }
  },

  clearAllParts: () => {
    set({ parts: [], selectedPartIds: [] });
    get().pushHistory();
  },

  // Project Persistence & Autosave State
  currentProjectId: undefined,
  currentProjectName: 'Production Nest #1',
  autosaveStatus: 'idle',
  lastSavedAt: null,

  createNewProject: () => {
    const defaultSheet = DEFAULT_SHEET;
    set({
      currentProjectId: undefined,
      currentProjectName: 'New Laser Project',
      parts: [],
      selectedPartIds: [],
      sheets: [defaultSheet],
      sheet: defaultSheet,
      activeSheetIndex: 0,
      autosaveStatus: 'idle',
      lastSavedAt: null,
      optimizationComparison: null,
    });
    analyticsService.trackEvent('project_created');
  },

  loadProject: (id: string) => {
    const proj = projectService.getProjectById(id);
    if (!proj) return;

    const baseSheet: Sheet = {
      id: `sheet_loaded_1`,
      name: `Sheet 600x300`,
      width: proj.sheetWidth,
      height: proj.sheetHeight,
      margin: proj.sheetMargin,
      spacing: proj.partSpacing,
      materialPricePerSheet: 15.0,
    };

    const loadedSheets = proj.sheets && proj.sheets.length > 0 ? proj.sheets : [baseSheet];

    set({
      currentProjectId: proj.id,
      currentProjectName: proj.name,
      parts: proj.parts || [],
      selectedPartIds: [],
      sheets: loadedSheets,
      sheet: loadedSheets[0],
      activeSheetIndex: 0,
      activeMaterialPresetId: proj.materialPresetId,
      autosaveStatus: 'saved',
      lastSavedAt: proj.updatedAt,
      activeTab: 'workspace',
      optimizationComparison: null,
    });
    analyticsService.trackEvent('project_loaded', { projectId: proj.id, name: proj.name });
  },

  saveCurrentProject: async () => {
    const { currentProjectId, currentProjectName, sheet, sheets, parts, getScore, activeMaterialPresetId } = get();
    set({ autosaveStatus: 'saving' });
    try {
      const scoreData = getScore();
      const saved = await projectService.saveProject(
        currentProjectId,
        currentProjectName,
        sheet,
        sheets,
        parts,
        scoreData.score,
        activeMaterialPresetId
      );
      set({
        currentProjectId: saved.id,
        autosaveStatus: 'saved',
        lastSavedAt: saved.updatedAt,
      });
    } catch {
      set({ autosaveStatus: 'error' });
    }
  },

  duplicateProjectById: (id: string) => {
    const dup = projectService.duplicateProject(id);
    if (dup) {
      get().loadProject(dup.id);
    }
  },

  deleteProjectById: (id: string) => {
    projectService.deleteProject(id);
    if (get().currentProjectId === id) {
      get().createNewProject();
    }
  },

  renameCurrentProject: (newName: string) => {
    const name = newName.trim() || 'Untitled Nest';
    set({ currentProjectName: name, autosaveStatus: 'unsaved' });
    const id = get().currentProjectId;
    if (id) {
      projectService.renameProject(id, name);
    }
    // Schedule autosave
    const { sheet, sheets, parts, getScore, activeMaterialPresetId } = get();
    autosaveEngine.scheduleAutosave(
      id,
      name,
      sheet,
      sheets,
      parts,
      getScore().score,
      activeMaterialPresetId,
      (status, savedProj) => {
        set({
          autosaveStatus: status,
          ...(savedProj ? { currentProjectId: savedProj.id, lastSavedAt: savedProj.updatedAt } : {}),
        });
      }
    );
  },

  // Material Presets & Workshop Profile
  materialPresets: DEFAULT_MATERIAL_PRESETS,
  activeMaterialPresetId: 'mat-birch-3mm',
  workshopProfile: DEFAULT_WORKSHOP_PROFILE,

  addMaterialPreset: (preset) => {
    const newPreset: MaterialPreset = {
      ...preset,
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...get().materialPresets, newPreset];
    set({ materialPresets: updated });
    analyticsService.trackEvent('material_preset_created', { name: newPreset.name });
  },

  deleteMaterialPreset: (id: string) => {
    const updated = get().materialPresets.filter((m) => m.id !== id);
    set({ materialPresets: updated });
  },

  selectMaterialPreset: (id: string) => {
    const target = get().materialPresets.find((m) => m.id === id);
    if (target) {
      get().updateSheet({
        width: target.widthMm,
        height: target.heightMm,
        materialName: target.name,
        materialPricePerSheet: target.pricePerSheet,
      });
      set({ activeMaterialPresetId: id });
    }
  },

  updateWorkshopProfile: (profile) => {
    set((state) => ({
      workshopProfile: { ...state.workshopProfile, ...profile },
    }));
  },

  // Gamification Retention Loop
  userStats: INITIAL_USER_STATS,
  missions: INITIAL_MISSIONS,
  achievements: INITIAL_ACHIEVEMENTS,
  streakDays: 7,

  // Modals state
  scoreBreakdownModalOpen: false,
  exportModalOpen: false,
  shortcutsModalOpen: false,
  projectsModalOpen: false,
  materialsModalOpen: false,
  onboardingModalOpen: false,

  setScoreBreakdownModalOpen: (open) => set({ scoreBreakdownModalOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  setProjectsModalOpen: (open) => set({ projectsModalOpen: open }),
  setMaterialsModalOpen: (open) => set({ materialsModalOpen: open }),
  setOnboardingModalOpen: (open) => set({ onboardingModalOpen: open }),

  getScore: () => calculateNestingScore(get().parts, get().sheet),
}));
