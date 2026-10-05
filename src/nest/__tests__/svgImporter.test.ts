import { describe, it, expect } from 'vitest';
import { SvgImporter } from '../core/svg/importer';

describe('SvgImporter Engine', () => {
  const importer = new SvgImporter();

  it('imports simple SVG rectangle correctly', () => {
    const svg = `<svg width="100mm" height="100mm" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'rect.svg');
    expect(design.parts.length).toBe(1);
    expect(design.parts[0].width).toBeCloseTo(80, 1);
    expect(design.parts[0].height).toBeCloseTo(80, 1);
    expect(design.parts[0].area).toBeCloseTo(6400, 1);
  });

  it('imports SVG circle element correctly', () => {
    const svg = `<svg width="100mm" height="100mm" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'circle.svg');
    expect(design.parts.length).toBe(1);
    expect(design.parts[0].width).toBeCloseTo(80, 0);
    expect(design.parts[0].height).toBeCloseTo(80, 0);
  });

  it('handles SVG path with transform and groups', () => {
    const svg = `<svg width="200mm" height="200mm" viewBox="0 0 200 200">
      <g transform="translate(20, 30) scale(2)">
        <path d="M 0 0 L 50 0 L 50 50 L 0 50 Z" />
      </g>
    </svg>`;

    const design = importer.parseSvgString(svg, 'transformed_path.svg');
    expect(design.parts.length).toBe(1);
    // Original 50x50 scaled by 2 = 100x100
    expect(design.parts[0].width).toBeCloseTo(100, 1);
    expect(design.parts[0].height).toBeCloseTo(100, 1);
  });

  it('correctly separates outer boundary vs inner hole cutouts', () => {
    const svg = `<svg width="100mm" height="100mm" viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" />
      <rect x="25" y="25" width="50" height="50" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'donut.svg');
    expect(design.parts.length).toBe(1);
    const geom = design.parts[0].geometry;
    expect(geom.contours.length).toBe(1);
    expect(geom.holes.length).toBe(1);
    // Outer area 100x100 = 10000, Hole area 50x50 = 2500 -> Total area = 7500
    expect(design.parts[0].area).toBeCloseTo(7500, 1);
  });

  it('handles empty or malformed SVG gracefully with error message', () => {
    const emptySvg = `<svg></svg>`;
    const design = importer.parseSvgString(emptySvg, 'empty.svg');
    expect(design.parts.length).toBe(0);
    expect(design.errors && design.errors.length > 0).toBe(true);
    expect(design.errors![0]).toContain('Could not import this SVG');
  });

  it('sanitizes malicious script tags and inline handlers', () => {
    const maliciousSvg = `<svg width="100mm" height="100mm" viewBox="0 0 100 100">
      <script>alert("xss")</script>
      <rect x="0" y="0" width="50" height="50" onload="alert('hack')" />
    </svg>`;

    const design = importer.parseSvgString(maliciousSvg, 'safe.svg');
    expect(design.parts.length).toBe(1);
    expect(design.parts[0].width).toBeCloseTo(50, 1);
  });
});
