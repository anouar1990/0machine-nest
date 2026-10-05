import { describe, it, expect } from 'vitest';
import {
  expandPartQuantities,
  generateCandidatePositions,
  placePartOnSheet,
  trueShapeNestParts,
} from '../nesting/algorithms/trueShapeNesting';
import { Sheet, Part } from '../core/types';

describe('True-Shape Nesting Engine (Part 2)', () => {
  const sampleSheet: Sheet = {
    id: 'sheet-1',
    name: 'Standard 600x300',
    width: 600,
    height: 300,
    margin: 5,
    spacing: 3,
    materialPricePerSheet: 15.0,
  };

  const sampleRectPart: Part = {
    id: 'rect-1',
    sourceFileName: 'box.svg',
    name: 'Box 50x50',
    geometry: {
      contours: [
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
          { x: 0, y: 50 },
          { x: 0, y: 0 },
        ],
      ],
      holes: [],
      bounds: { minX: 0, minY: 0, maxX: 50, maxY: 50, width: 50, height: 50 },
      area: 2500,
    },
    quantity: 3,
    width: 50,
    height: 50,
    area: 2500,
    position: { x: 0, y: 0 },
    rotation: 0,
    locked: false,
    selected: false,
  };

  it('expands part quantities into individual Part placement instances', () => {
    const expanded = expandPartQuantities([sampleRectPart]);
    expect(expanded.length).toBe(3);
    expect(expanded[0].id).toContain('rect-1_item_0');
    expect(expanded[1].id).toContain('rect-1_item_1');
  });

  it('generates candidate positions respecting margin boundary', () => {
    const candidates = generateCandidatePositions(50, 50, sampleSheet, []);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].x).toBeGreaterThanOrEqual(sampleSheet.margin);
    expect(candidates[0].y).toBeGreaterThanOrEqual(sampleSheet.margin);
  });

  it('places part on sheet without colliding with existing parts', () => {
    const placedFirst: Part = {
      ...sampleRectPart,
      id: 'placed_1',
      position: { x: 5, y: 5 },
    };

    const nextPart = placePartOnSheet(sampleRectPart, sampleSheet, [placedFirst]);
    expect(nextPart).not.toBeNull();
    // Next part position x should be placed beyond first part width + spacing (5 + 50 + 3 = 58)
    expect(nextPart!.position.x).toBeGreaterThanOrEqual(58);
  });

  it('preserves locked parts as fixed obstacles during nesting', () => {
    const lockedObstacle: Part = {
      ...sampleRectPart,
      id: 'locked_obstacle',
      position: { x: 5, y: 5 },
      locked: true,
    };

    const partsToNest = [lockedObstacle, sampleRectPart];
    const scoreResult = trueShapeNestParts(partsToNest, sampleSheet);

    expect(scoreResult.totalPartsPlaced).toBeGreaterThan(0);
    // Locked obstacle position must remain untouched
    const lockedInResult = scoreResult.sheetResults[0].parts.find((p) => p.id === 'locked_obstacle');
    expect(lockedInResult).toBeDefined();
    expect(lockedInResult!.position.x).toBe(5);
    expect(lockedInResult!.position.y).toBe(5);
  });

  it('allocates multiple sheets automatically if parts exceed single sheet capacity', () => {
    const tinySheet: Sheet = {
      ...sampleSheet,
      width: 100,
      height: 100,
      margin: 5,
      spacing: 2,
    };

    // 6 parts of 50x50 cannot fit on one 100x100 sheet (max 1 part per 100x100 sheet)
    const largeQuantityPart: Part = {
      ...sampleRectPart,
      quantity: 4,
    };

    const multiSheetScore = trueShapeNestParts([largeQuantityPart], tinySheet);
    expect(multiSheetScore.sheetCount).toBeGreaterThan(1);
    expect(multiSheetScore.sheetResults.length).toBe(multiSheetScore.sheetCount);
  });
});
