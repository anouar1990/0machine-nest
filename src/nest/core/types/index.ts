export type Point = {
  x: number;
  y: number;
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type Contour = Point[];

export type Geometry = {
  contours: Contour[]; // Outer contours (polygons)
  holes: Contour[];    // Inner cutouts / holes
  bounds: Bounds;
  area: number;        // in mm^2 (outer area minus holes area)
};

export type Part = {
  id: string;
  sourcePartId?: string; // Reference to original part if quantity expanded
  sourceFileName: string;
  name: string;
  geometry: Geometry;
  quantity: number;
  width: number;       // in mm
  height: number;      // in mm
  area: number;        // in mm^2
  position: {
    x: number;         // x coordinate on sheet in mm
    y: number;         // y coordinate on sheet in mm
  };
  rotation: number;    // 0, 90, 180, 270 (degrees)
  locked: boolean;
  selected: boolean;
  color?: string;
  sheetIndex?: number; // Which sheet this part belongs to
};

export type Sheet = {
  id: string;
  name: string;
  width: number;                 // in mm (default: 600)
  height: number;                // in mm (default: 300)
  margin: number;                // in mm (default: 5)
  spacing: number;               // in mm (default: 3)
  materialName?: string;         // e.g. "Plywood 3mm"
  materialPricePerSheet?: number;// e.g. 15.00
};

export type NormalizedDesign = {
  fileName: string;
  parts: Array<{
    geometry: Geometry;
    width: number;
    height: number;
    area: number;
    name?: string;
  }>;
  errors?: string[];
  warnings?: string[];
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type SheetLayoutResult = {
  sheetIndex: number;
  sheet: Sheet;
  parts: Part[];
  utilizationPercentage: number;
  wastePercentage: number;
  score: number;
  areaUsedMm2: number;
};

export type NestingScore = {
  score: number;                 // 0 to 100
  wastePercentage: number;       // e.g. 6.2
  utilizationPercentage: number; // e.g. 93.8
  totalPartsPlaced: number;
  totalPartsAvailable: number;
  areaUsedMm2: number;
  sheetUsableAreaMm2: number;
  materialSavedEur: number;
  sheetCount: number;            // Number of sheets required
  sheetResults: SheetLayoutResult[];
};

export type NestingOptions = {
  rotations: number[];           // e.g. [0, 90, 180, 270]
  strategy: 'area_desc' | 'max_dim_desc' | 'perimeter_desc' | 'multi_start';
  multiStartCount: number;       // e.g. 10 strategies
  timeBudgetMs: number;          // e.g. 5000ms
  compactnessWeight: number;     // 0 to 1
};

export type OptimizationComparison = {
  before: {
    sheetCount: number;
    utilizationPercentage: number;
    wastePercentage: number;
    totalMaterialCostEur: number;
  };
  after: {
    sheetCount: number;
    utilizationPercentage: number;
    wastePercentage: number;
    totalMaterialCostEur: number;
  };
  saved: {
    sheetsSaved: number;
    wasteReducedPercentage: number;
    costSavedEur: number;
  };
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  progress: number;              // 0 to 100
  completed: boolean;
  type: 'score' | 'waste' | 'nest_count' | 'speed';
  targetValue: number;
  currentValue: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export type PersonalRecords = {
  bestUtilization: number;       // e.g. 96.8 %
  lowestWaste: number;           // e.g. 3.2 %
  mostParts: number;             // e.g. 184
  mostMaterialSavedEur: number;  // e.g. 42.70
  fastestNestSec: number;        // e.g. 11.4
};

export type UserStats = {
  score: number;
  level: number;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;
  jobsCompleted: number;
  sheetsOptimized: number;
  totalMaterialSavedEur: number;
  averageWastePercentage: number;
  personalRecords: PersonalRecords;
};

export type MaterialPreset = {
  id: string;
  name: string;             // e.g. "Baltic Birch Plywood 3mm"
  thicknessMm: number;      // e.g. 3.0
  widthMm: number;          // e.g. 600
  heightMm: number;         // e.g. 300
  pricePerSheet: number;    // e.g. 15.00
  currency: string;         // e.g. "EUR" or "$"
};

export type WorkshopProfile = {
  workshopName: string;     // e.g. "NestCorp Workshop #1"
  defaultMaterialId?: string;
  defaultSheetWidth: number;
  defaultSheetHeight: number;
  defaultSpacing: number;
  defaultMargin: number;
  currency: string;
};

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';

export type ScoreBreakdown = {
  overallScore: number;
  materialUtilizationScore: number; // 0-100
  wasteEfficiencyScore: number;     // 0-100
  sheetEfficiencyScore: number;     // 0-100
  layoutQualityScore: number;       // 0-100
  explanation: string[];
};

export type NestProject = {
  id: string;
  userId?: string;
  name: string;
  sheetWidth: number;
  sheetHeight: number;
  sheetMargin: number;
  partSpacing: number;
  sheets: Sheet[];
  parts: Part[];
  score: number;
  materialPresetId?: string;
  createdAt: string;
  updatedAt: string;
};
