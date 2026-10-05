import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '../services/projectService';
import { validatePreExport } from '../export/exportValidation';
import { exportSheetToSvg, exportAllSheetsToSvg } from '../export/svgExporter';
import { getExplainableScoreBreakdown } from '../nesting/scoring/scoreBreakdown';
import { Sheet, Part } from '../core/types';

describe('Part 3 Production & Productization Test Suite', () => {
  const testSheet: Sheet = {
    id: 'prod-sheet-1',
    name: 'Baltic Birch 600x300',
    width: 600,
    height: 300,
    margin: 5,
    spacing: 3,
    materialPricePerSheet: 15.0,
  };

  const testPart: Part = {
    id: 'prod-part-1',
    sourceFileName: 'test_panel.svg',
    name: 'Test Panel',
    geometry: {
      contours: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 50 },
          { x: 0, y: 50 },
          { x: 0, y: 0 },
        ],
      ],
      holes: [],
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 50, width: 100, height: 50 },
      area: 5000,
    },
    quantity: 1,
    width: 100,
    height: 50,
    area: 5000,
    position: { x: 10, y: 10 },
    rotation: 0,
    locked: false,
    selected: false,
    sheetIndex: 0,
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('1. Project Service handles save, load, duplicate, rename, delete', async () => {
    const proj = await projectService.saveProject(
      undefined,
      'Laser Box Job',
      testSheet,
      [testSheet],
      [testPart],
      92
    );

    expect(proj.id).toBeDefined();
    expect(proj.name).toBe('Laser Box Job');

    const fetched = projectService.getProjectById(proj.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.score).toBe(92);

    const dup = projectService.duplicateProject(proj.id);
    expect(dup).not.toBeNull();
    expect(dup?.name).toBe('Laser Box Job (Copy)');

    const renamed = projectService.renameProject(proj.id, 'Renamed Laser Job');
    expect(renamed?.name).toBe('Renamed Laser Job');

    projectService.deleteProject(proj.id);
    expect(projectService.getProjectById(proj.id)).toBeNull();
  });

  it('2. Pre-Export Validation detects valid vs invalid layouts', () => {
    // Valid placement inside sheet boundaries
    const validRes = validatePreExport([testPart], testSheet);
    expect(validRes.isValid).toBe(true);
    expect(validRes.errors.length).toEqual(0);

    // Out of bounds part
    const oobPart: Part = {
      ...testPart,
      position: { x: 550, y: 280 }, // Exceeds 600x300 sheet with 5mm margin (max 595x295)
    };
    const invalidRes = validatePreExport([oobPart], testSheet);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.errors.length).toBeGreaterThan(0);
  });

  it('3. SVG Exporter generates clean vector output', () => {
    const singleSvg = exportSheetToSvg([testPart], testSheet);
    expect(singleSvg).toContain('<?xml version="1.0"');
    expect(singleSvg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(singleSvg).toContain('width="600mm" height="300mm"');
    expect(singleSvg).toContain('id="nested-parts"');

    const multiSvg = exportAllSheetsToSvg([testPart], [testSheet, { ...testSheet, id: 'sheet-2' }]);
    expect(multiSvg).toContain('MULTI-SHEET EXPORT');
    expect(multiSvg).toContain('id="sheet-1"');
    expect(multiSvg).toContain('id="sheet-2"');
  });

  it('4. Score Breakdown computes explainable sub-metrics', () => {
    const breakdown = getExplainableScoreBreakdown([testPart], testSheet);
    expect(breakdown.overallScore).toBeGreaterThanOrEqual(0);
    expect(breakdown.overallScore).toBeLessThanOrEqual(100);
    expect(breakdown.materialUtilizationScore).toBeDefined();
    expect(breakdown.wasteEfficiencyScore).toBeDefined();
    expect(breakdown.sheetEfficiencyScore).toBeDefined();
    expect(breakdown.layoutQualityScore).toBeDefined();
    expect(breakdown.explanation.length).toBe(4);
  });
});
