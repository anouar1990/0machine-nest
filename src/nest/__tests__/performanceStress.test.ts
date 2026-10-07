import { describe, it, expect } from 'vitest';
import { trueShapeNestParts, expandPartQuantities } from '../nesting/algorithms/trueShapeNesting';
import { Sheet, Part } from '../core/types';

describe('Production Performance Stress & Benchmark Suite', () => {
  const benchmarkSheet: Sheet = {
    id: 'bench-sheet-1',
    name: 'Standard Baltic Birch 1200x600',
    width: 1200,
    height: 600,
    margin: 5,
    spacing: 3,
    materialPricePerSheet: 28.0,
  };

  const sampleRectPart: Part = {
    id: 'bench-part-rect',
    sourceFileName: 'benchmark_panel.svg',
    name: 'Benchmark Panel',
    geometry: {
      contours: [
        [
          { x: 0, y: 0 },
          { x: 120, y: 0 },
          { x: 120, y: 80 },
          { x: 0, y: 80 },
          { x: 0, y: 0 },
        ],
      ],
      holes: [],
      bounds: { minX: 0, minY: 0, maxX: 120, maxY: 80, width: 120, height: 80 },
      area: 9600,
    },
    quantity: 1,
    width: 120,
    height: 80,
    area: 9600,
    position: { x: 0, y: 0 },
    rotation: 0,
    locked: false,
    selected: false,
    sheetIndex: 0,
  };

  function runBenchmark(count: number): { timeMs: number; score: number; sheetCount: number } {
    const partsList: Part[] = Array.from({ length: count }).map((_, idx) => ({
      ...sampleRectPart,
      id: `part_bench_${count}_${idx}`,
      name: `Part #${idx + 1}`,
      quantity: 1,
    }));

    const expanded = expandPartQuantities(partsList);
    const start = performance.now();
    const scoreData = trueShapeNestParts(expanded, benchmarkSheet, {
      rotations: [0, 90],
      multiStartCount: 2,
    });
    const duration = performance.now() - start;

    return {
      timeMs: parseFloat(duration.toFixed(2)),
      score: scoreData.score,
      sheetCount: scoreData.sheetCount,
    };
  }

  it('10 parts benchmark', () => {
    const res = runBenchmark(10);
    console.log(`[PERF BENCHMARK] 10 Parts: ${res.timeMs}ms | Sheets: ${res.sheetCount} | Score: ${res.score}`);
    expect(res.timeMs).toBeLessThan(1000);
    expect(res.sheetCount).toBeGreaterThan(0);
  });

  it('25 parts benchmark', () => {
    const res = runBenchmark(25);
    console.log(`[PERF BENCHMARK] 25 Parts: ${res.timeMs}ms | Sheets: ${res.sheetCount} | Score: ${res.score}`);
    expect(res.timeMs).toBeLessThan(2500);
    expect(res.sheetCount).toBeGreaterThan(0);
  });

  it('50 parts benchmark', () => {
    const res = runBenchmark(50);
    console.log(`[PERF BENCHMARK] 50 Parts: ${res.timeMs}ms | Sheets: ${res.sheetCount} | Score: ${res.score}`);
    expect(res.timeMs).toBeLessThan(4000);
    expect(res.sheetCount).toBeGreaterThan(0);
  });

  it('100 parts benchmark', { timeout: 20000 }, () => {
    const res = runBenchmark(100);
    console.log(`[PERF BENCHMARK] 100 Parts: ${res.timeMs}ms | Sheets: ${res.sheetCount} | Score: ${res.score}`);
    expect(res.timeMs).toBeLessThan(15000);
    expect(res.sheetCount).toBeGreaterThan(0);
  });
});
