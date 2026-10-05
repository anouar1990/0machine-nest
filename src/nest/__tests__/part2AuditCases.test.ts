import { describe, it, expect } from 'vitest';
import {
  rotateGeometry,
} from '../core/geometry';
import { checkPartCollision, checkSheetCollision } from '../nesting/collision';
import {
  expandPartQuantities,
  trueShapeNestParts,
} from '../nesting/algorithms/trueShapeNesting';
import { Sheet, Part, Geometry } from '../core/types';

describe('Part 2 Comprehensive Audit & Edge Cases', () => {
  const standardSheet: Sheet = {
    id: 'audit-sheet',
    name: 'Baltic Birch 600x300',
    width: 600,
    height: 300,
    margin: 5,
    spacing: 3,
    materialPricePerSheet: 20.0,
  };

  // Case B: L-Shaped Concave Geometry
  const L_SHAPE_GEOMETRY: Geometry = {
    contours: [
      [
        { x: 0, y: 0 },
        { x: 60, y: 0 },
        { x: 60, y: 20 },
        { x: 20, y: 20 },
        { x: 20, y: 60 },
        { x: 0, y: 60 },
        { x: 0, y: 0 },
      ],
    ],
    holes: [],
    bounds: { minX: 0, minY: 0, maxX: 60, maxY: 60, width: 60, height: 60 },
    area: 2000,
  };

  const partL1: Part = {
    id: 'L1',
    sourceFileName: 'l_shape.svg',
    name: 'L-Bracket 1',
    geometry: L_SHAPE_GEOMETRY,
    quantity: 1,
    width: 60,
    height: 60,
    area: 2000,
    position: { x: 10, y: 10 },
    rotation: 0,
    locked: false,
    selected: false,
  };

  it('Section 4 Case B: Concave L-shaped parts SAT collision detection', () => {
    // Second L-shape placed adjacent
    const partL2: Part = {
      ...partL1,
      id: 'L2',
      position: { x: 75, y: 10 },
    };

    // Distant -> No collision
    expect(checkPartCollision(partL1, partL2, 3)).toBe(false);

    // Overlapping bounding box & overlapping contours -> Collision
    const partL2Overlap: Part = {
      ...partL1,
      id: 'L2_overlap',
      position: { x: 15, y: 15 },
    };
    expect(checkPartCollision(partL1, partL2Overlap, 3)).toBe(true);
  });

  it('Section 4 Case E & F: Spacing enforcement (spacing = 0 vs spacing > 0)', () => {
    const squareGeom: Geometry = {
      contours: [
        [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 20 },
          { x: 0, y: 20 },
          { x: 0, y: 0 },
        ],
      ],
      holes: [],
      bounds: { minX: 0, minY: 0, maxX: 20, maxY: 20, width: 20, height: 20 },
      area: 400,
    };

    const sq1: Part = {
      id: 'sq1',
      sourceFileName: 'sq.svg',
      name: 'Square 1',
      geometry: squareGeom,
      quantity: 1,
      width: 20,
      height: 20,
      area: 400,
      position: { x: 10, y: 10 },
      rotation: 0,
      locked: false,
      selected: false,
    };

    // Placed at x = 32mm (Distance = 2mm from sq1 which ends at x=30mm)
    const sq2Near: Part = {
      ...sq1,
      id: 'sq2',
      position: { x: 32, y: 10 },
    };

    // With spacing = 3mm, 2mm gap is LESS than required 3mm -> Collision!
    expect(checkPartCollision(sq1, sq2Near, 3)).toBe(true);

    // With spacing = 1mm, 2mm gap is GREATER than required 1mm -> No Collision!
    expect(checkPartCollision(sq1, sq2Near, 1)).toBe(false);

    // Placed at x = 34mm (Distance = 4mm from sq1)
    const sq2Far: Part = {
      ...sq1,
      id: 'sq2_far',
      position: { x: 34, y: 10 },
    };
    expect(checkPartCollision(sq1, sq2Far, 3)).toBe(false);
  });

  it('Section 6: Sheet boundary enforcement and margin offsets', () => {
    const bigPart: Part = {
      ...partL1,
      position: { x: 5, y: 5 }, // x=5, width=60 -> maxX = 65
    };

    const tightSheet: Sheet = {
      ...standardSheet,
      width: 60, // Printable width with 5mm margin is 50mm. Part width is 60mm -> Out of bounds!
    };

    expect(checkSheetCollision(bigPart, tightSheet)).toBe(true);
  });

  it('Section 7: Geometry rotation updates bounds and dimensions without mutation', () => {
    const rectGeom: Geometry = {
      contours: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 40 },
          { x: 0, y: 40 },
          { x: 0, y: 0 },
        ],
      ],
      holes: [],
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 40, width: 100, height: 40 },
      area: 4000,
    };

    const rotated90 = rotateGeometry(rectGeom, 90);
    expect(rotated90.bounds.width).toBeCloseTo(40, 1);
    expect(rotated90.bounds.height).toBeCloseTo(100, 1);
    expect(rectGeom.bounds.width).toBe(100); // Original unmutated!
  });

  it('Section 8 & 9: Quantity expansion and multi-sheet allocation tracking', () => {
    const multiQtyPart: Part = {
      ...partL1,
      quantity: 15,
    };

    const expanded = expandPartQuantities([multiQtyPart]);
    expect(expanded.length).toBe(15);
    expanded.forEach((p) => {
      expect(p.sourcePartId).toBe('L1');
    });
  });

  it('Section 10: Locked parts obstacle preservation', () => {
    const lockedPart: Part = {
      ...partL1,
      id: 'locked_p1',
      position: { x: 10, y: 10 },
      rotation: 0,
      locked: true,
    };

    const freePart: Part = {
      ...partL1,
      id: 'free_p2',
      quantity: 1,
      locked: false,
    };

    const result = trueShapeNestParts([lockedPart, freePart], standardSheet);
    expect(result.sheetResults[0].parts.length).toBe(2);

    const checkLocked = result.sheetResults[0].parts.find((p) => p.id === 'locked_p1');
    expect(checkLocked).toBeDefined();
    expect(checkLocked!.position.x).toBe(10);
    expect(checkLocked!.position.y).toBe(10);
  });

  it('Section 26: Data integrity — 5 repeated optimizations leave source geometry untouched', () => {
    const originalWidth = partL1.width;
    const originalHeight = partL1.height;
    const originalArea = partL1.area;

    for (let i = 0; i < 5; i++) {
      trueShapeNestParts([partL1], standardSheet);
    }

    expect(partL1.width).toBe(originalWidth);
    expect(partL1.height).toBe(originalHeight);
    expect(partL1.area).toBe(originalArea);
  });
});
