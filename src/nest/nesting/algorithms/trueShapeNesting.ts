import {
  Part,
  Sheet,
  NestingOptions,
  SheetLayoutResult,
  NestingScore,
  Point,
} from '../../core/types';
import { checkSheetCollision, checkPartCollision } from '../collision';
import { calculateNestingScore } from '../scoring';
import { rotateGeometry } from '../../core/geometry';

/**
 * Expands part quantities into individual Part placement instances.
 */
export function expandPartQuantities(parts: Part[]): Part[] {
  const expanded: Part[] = [];

  parts.forEach((p) => {
    const qty = Math.max(1, p.quantity || 1);
    for (let q = 0; q < qty; q++) {
      expanded.push({
        ...JSON.parse(JSON.stringify(p)),
        id: `${p.id}_item_${q}`,
        sourcePartId: p.id,
        quantity: 1, // Individual placement
        selected: false,
      });
    }
  });

  return expanded;
}

/**
 * Generates candidate placement coordinates (x, y) for a part on the sheet.
 */
export function generateCandidatePositions(
  partWidth: number,
  partHeight: number,
  sheet: Sheet,
  placedParts: Part[],
  stepMm: number = 5
): Point[] {
  const margin = sheet.margin || 5;
  const spacing = sheet.spacing || 3;
  const candidates: Point[] = [];
  const candidateSet = new Set<string>();

  const addCandidate = (x: number, y: number) => {
    const roundX = Math.round(x * 10) / 10;
    const roundY = Math.round(y * 10) / 10;

    if (
      roundX >= margin &&
      roundY >= margin &&
      roundX + partWidth <= sheet.width - margin &&
      roundY + partHeight <= sheet.height - margin
    ) {
      const key = `${roundX}_${roundY}`;
      if (!candidateSet.has(key)) {
        candidateSet.add(key);
        candidates.push({ x: roundX, y: roundY });
      }
    }
  };

  // 1. Initial Sheet Corner Candidates
  addCandidate(margin, margin);
  addCandidate(sheet.width - margin - partWidth, margin);
  addCandidate(margin, sheet.height - margin - partHeight);

  // 2. Candidates derived from placed parts boundaries & alignment offsets
  placedParts.forEach((placed) => {
    const pBounds = placed.geometry.bounds;
    const px = placed.position.x;
    const py = placed.position.y;
    const pw = pBounds.width;
    const ph = pBounds.height;

    // Right of placed part
    addCandidate(px + pw + spacing, py);
    addCandidate(px + pw + spacing, margin);
    addCandidate(px + pw + spacing, py + ph - partHeight);

    // Below placed part
    addCandidate(px, py + ph + spacing);
    addCandidate(margin, py + ph + spacing);
    addCandidate(px + pw - partWidth, py + ph + spacing);

    // Diagonal corner of placed part
    addCandidate(px + pw + spacing, py + ph + spacing);

    // Align left/top with placed part
    addCandidate(px, margin);
    addCandidate(margin, py);
  });

  // 3. Coarse Sampling for gaps (25mm step)
  const coarseStep = 25;
  for (let y = margin; y <= sheet.height - margin - partHeight; y += coarseStep) {
    for (let x = margin; x <= sheet.width - margin - partWidth; x += coarseStep) {
      addCandidate(x, y);
    }
  }

  // Sort candidates by Bottom-Left priority (y first, then x)
  return candidates.sort((a, b) => a.y * 1000 + a.x - (b.y * 1000 + b.x));
}

/**
 * Attempts to place a single part on the sheet trying allowed rotations & candidate positions.
 */
export function placePartOnSheet(
  partToPlace: Part,
  sheet: Sheet,
  placedParts: Part[],
  allowedRotations: number[] = [0, 90, 180, 270]
): Part | null {
  let bestCandidate: Part | null = null;
  let bestScore = Infinity;

  for (const rotDeg of allowedRotations) {
    // Apply rotation to geometry if needed
    const rotatedGeom =
      rotDeg === 0 ? partToPlace.geometry : rotateGeometry(partToPlace.geometry, rotDeg);
    const rWidth = rotatedGeom.bounds.width;
    const rHeight = rotatedGeom.bounds.height;

    const candidates = generateCandidatePositions(rWidth, rHeight, sheet, placedParts);

    for (const cand of candidates) {
      const testPart: Part = {
        ...partToPlace,
        rotation: (partToPlace.rotation + rotDeg) % 360,
        geometry: rotatedGeom,
        width: rWidth,
        height: rHeight,
        position: { x: cand.x, y: cand.y },
      };

      // Narrow-Phase Collision & Sheet Boundary Check
      if (checkSheetCollision(testPart, sheet)) continue;

      let collides = false;
      for (const placed of placedParts) {
        if (checkPartCollision(testPart, placed, sheet.spacing || 3)) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        // Evaluate Bottom-Left compactness score
        const score = cand.y * 1000 + cand.x;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = testPart;
        }
      }
    }
  }

  return bestCandidate;
}

/**
 * Performs local compaction pass sliding parts left/up if space allows.
 */
export function compactSheetLayout(placedParts: Part[], sheet: Sheet): Part[] {
  const margin = sheet.margin || 5;
  const spacing = sheet.spacing || 3;
  const result: Part[] = [];

  for (const part of placedParts) {
    if (part.locked) {
      result.push(part);
      continue;
    }

    let current = { ...part };

    // Try sliding left by 1mm steps
    while (current.position.x > margin) {
      const candidate = {
        ...current,
        position: { x: current.position.x - 1, y: current.position.y },
      };
      if (checkSheetCollision(candidate, sheet)) break;

      let collide = false;
      for (const other of result) {
        if (checkPartCollision(candidate, other, spacing)) {
          collide = true;
          break;
        }
      }
      if (collide) break;
      current = candidate;
    }

    // Try sliding up by 1mm steps
    while (current.position.y > margin) {
      const candidate = {
        ...current,
        position: { x: current.position.x, y: current.position.y - 1 },
      };
      if (checkSheetCollision(candidate, sheet)) break;

      let collide = false;
      for (const other of result) {
        if (checkPartCollision(candidate, other, spacing)) {
          collide = true;
          break;
        }
      }
      if (collide) break;
      current = candidate;
    }

    result.push(current);
  }

  return result;
}

/**
 * Single-pass Nesting Strategy Generator.
 */
export function runNestingStrategy(
  unplacedParts: Part[],
  sheet: Sheet,
  existingObstacles: Part[] = [],
  rotations: number[] = [0, 90, 180, 270]
): { placedParts: Part[]; remainingUnplaced: Part[] } {
  const placedParts: Part[] = [...existingObstacles];
  const remainingUnplaced: Part[] = [];

  for (const part of unplacedParts) {
    const placed = placePartOnSheet(part, sheet, placedParts, rotations);
    if (placed) {
      placedParts.push(placed);
    } else {
      remainingUnplaced.push(part);
    }
  }

  const compacted = compactSheetLayout(placedParts, sheet);
  return { placedParts: compacted, remainingUnplaced };
}

/**
 * TRUE-SHAPE MULTI-START NESTING ENGINE (Main Export)
 * Runs multiple placement strategies and selects the highest material utilization layout.
 * Supports multi-sheet allocation if all parts cannot fit on one sheet.
 */
export function trueShapeNestParts(
  parts: Part[],
  sheet: Sheet,
  options?: Partial<NestingOptions>
): NestingScore {
  const rotations = options?.rotations || [0, 90, 180, 270];
  const multiStartCount = options?.multiStartCount || 6;

  // 1. Separate locked parts (obstacles) from unlocked parts
  const lockedObstacles = parts.filter((p) => p.locked);
  const unlockedParts = parts.filter((p) => !p.locked);

  // 2. Expand unlocked part quantities into individual placements
  const expandedItems = expandPartQuantities(unlockedParts);

  if (expandedItems.length === 0 && lockedObstacles.length === 0) {
    return calculateNestingScore([], sheet);
  }

  // 3. Multi-Start Strategy Definitions
  const sortingStrategies: Array<(items: Part[]) => Part[]> = [
    // Strategy 1: Area Descending (Largest shapes first)
    (items) => [...items].sort((a, b) => b.area - a.area),
    // Strategy 2: Max Dimension Descending
    (items) =>
      [...items].sort(
        (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height)
      ),
    // Strategy 3: Perimeter / Bounding Area Descending
    (items) => [...items].sort((a, b) => b.width * b.height - a.width * a.height),
    // Strategy 4: Aspect Ratio Descending
    (items) => [...items].sort((a, b) => b.width / b.height - a.width / a.height),
    // Strategy 5: Area Ascending (Smallest shapes first)
    (items) => [...items].sort((a, b) => a.area - b.area),
  ];

  let bestMultiSheetResults: SheetLayoutResult[] = [];
  let bestOverallScore = -1;

  const runsToExecute = Math.min(multiStartCount, sortingStrategies.length);

  for (let s = 0; s < runsToExecute; s++) {
    const sortedItems = sortingStrategies[s](expandedItems);

    let currentUnplaced = [...sortedItems];
    let sheetIndex = 0;
    const sheetResults: SheetLayoutResult[] = [];

    // Process sheets until all parts are placed
    while (currentUnplaced.length > 0 || (sheetIndex === 0 && lockedObstacles.length > 0)) {
      const currentObstacles = sheetIndex === 0 ? lockedObstacles : [];
      const result = runNestingStrategy(
        currentUnplaced,
        sheet,
        currentObstacles,
        rotations
      );

      const placedOnThisSheet = result.placedParts;
      const sheetScoreData = calculateNestingScore(placedOnThisSheet, sheet);

      sheetResults.push({
        sheetIndex: sheetIndex + 1,
        sheet,
        parts: placedOnThisSheet,
        utilizationPercentage: sheetScoreData.utilizationPercentage,
        wastePercentage: sheetScoreData.wastePercentage,
        score: sheetScoreData.score,
        areaUsedMm2: sheetScoreData.areaUsedMm2,
      });

      // If no progress made in placement, break to avoid infinite loop
      if (result.remainingUnplaced.length === currentUnplaced.length) {
        break; // Unable to place remaining parts
      }

      currentUnplaced = result.remainingUnplaced;
      sheetIndex++;

      if (sheetIndex > 20) break; // Limit safety
    }

    // Evaluate overall multi-sheet utilization score
    const avgUtilization =
      sheetResults.reduce((acc, sr) => acc + sr.utilizationPercentage, 0) /
      Math.max(1, sheetResults.length);

    if (avgUtilization > bestOverallScore) {
      bestOverallScore = avgUtilization;
      bestMultiSheetResults = sheetResults;
    }
  }

  // Combine placed parts across all sheets for final score object
  const allPlacedParts = bestMultiSheetResults.flatMap((sr) => sr.parts);
  const finalScore = calculateNestingScore(allPlacedParts, sheet);

  return {
    ...finalScore,
    sheetCount: Math.max(1, bestMultiSheetResults.length),
    sheetResults: bestMultiSheetResults,
  };
}
