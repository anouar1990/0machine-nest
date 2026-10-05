import { describe, it, expect } from 'vitest';
import {
  computeBounds,
  computeContourArea,
  computeGeometryArea,
  isPointInPolygon,
  sampleCircle,
} from '../core/geometry';
import { inchesToMm, parseSvgLengthToMm } from '../core/units';

describe('Geometry Engine', () => {
  it('computes correct bounding box', () => {
    const points = [
      { x: 10, y: 5 },
      { x: 50, y: 20 },
      { x: 30, y: 100 },
    ];
    const bounds = computeBounds(points);
    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(5);
    expect(bounds.maxX).toBe(50);
    expect(bounds.maxY).toBe(100);
    expect(bounds.width).toBe(40);
    expect(bounds.height).toBe(95);
  });

  it('computes contour area correctly using Shoelace formula', () => {
    // 10x10 square area = 100
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const area = Math.abs(computeContourArea(square));
    expect(area).toBe(100);
  });

  it('computes total geometry area (outer minus holes)', () => {
    // Outer 20x20 square (area 400), hole 10x10 square (area 100)
    const outer = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ];
    const hole = [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 15 },
      { x: 5, y: 15 },
    ];

    const totalArea = computeGeometryArea([outer], [hole]);
    expect(totalArea).toBe(300);
  });

  it('tests point containment in polygon using ray-casting', () => {
    const poly = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ];
    expect(isPointInPolygon({ x: 25, y: 25 }, poly)).toBe(true);
    expect(isPointInPolygon({ x: 60, y: 25 }, poly)).toBe(false);
  });

  it('samples circle into polylines', () => {
    const pts = sampleCircle(0, 0, 10, 16);
    expect(pts.length).toBe(16);
    const bounds = computeBounds(pts);
    expect(bounds.width).toBeCloseTo(20, 0);
    expect(bounds.height).toBeCloseTo(20, 0);
  });
});

describe('Units Utility', () => {
  it('converts inches to mm', () => {
    expect(inchesToMm(1)).toBe(25.4);
    expect(inchesToMm(2)).toBe(50.8);
  });

  it('parses SVG length strings with units to mm', () => {
    expect(parseSvgLengthToMm('100mm')).toBe(100);
    expect(parseSvgLengthToMm('1in')).toBe(25.4);
    expect(parseSvgLengthToMm('10cm')).toBe(100);
  });
});
