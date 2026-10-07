import { describe, it, expect, beforeEach } from 'vitest';
import { SvgImporter } from '../core/svg/importer';
import { useNestStore } from '../state/useNestStore';

describe('SVG Multi-Part Grouping & Decomposition Repair Suite', () => {
  const importer = new SvgImporter();

  beforeEach(() => {
    useNestStore.setState({
      sheet: {
        id: 'test-sheet',
        name: 'Standard Sheet',
        width: 600,
        height: 300,
        margin: 5,
        spacing: 3,
        materialPricePerSheet: 15.0,
      },
      sheets: [
        {
          id: 'test-sheet',
          name: 'Standard Sheet',
          width: 600,
          height: 300,
          margin: 5,
          spacing: 3,
          materialPricePerSheet: 15.0,
        },
      ],
      activeSheetIndex: 0,
      parts: [],
      selectedPartIds: [],
      history: [
        {
          sheet: {
            id: 'test-sheet',
            name: 'Standard Sheet',
            width: 600,
            height: 300,
            margin: 5,
            spacing: 3,
            materialPricePerSheet: 15.0,
          },
          sheets: [
            {
              id: 'test-sheet',
              name: 'Standard Sheet',
              width: 600,
              height: 300,
              margin: 5,
              spacing: 3,
              materialPricePerSheet: 15.0,
            },
          ],
          parts: [],
        },
      ],
      historyIndex: 0,
    });
  });

  it('Test 1 — Five independent paths decompose into 5 independent Parts', () => {
    const svg = `<svg width="500mm" height="500mm" viewBox="0 0 500 500">
      <rect x="10" y="10" width="50" height="50" id="pathA" />
      <rect x="100" y="10" width="40" height="40" id="pathB" />
      <circle cx="200" cy="30" r="20" id="pathC" />
      <rect x="300" y="10" width="60" height="40" id="pathD" />
      <polygon points="400,10 450,10 425,50" id="pathE" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'five_paths.svg');
    expect(design.parts.length).toBe(5);

    useNestStore.getState().addImportedDesign(design);
    const storeParts = useNestStore.getState().parts;
    expect(storeParts.length).toBe(5);
  });

  it('Test 2 — Five explicit groups decompose into 5 independent Parts', () => {
    const svg = `<svg width="500mm" height="500mm" viewBox="0 0 500 500">
      <g id="design_a">
        <rect x="10" y="10" width="50" height="50" />
      </g>
      <g id="design_b">
        <rect x="100" y="10" width="40" height="40" />
      </g>
      <g id="design_c">
        <circle cx="200" cy="30" r="20" />
      </g>
      <g id="design_d">
        <rect x="300" y="10" width="60" height="40" />
      </g>
      <g id="design_e">
        <polygon points="400,10 450,10 425,50" />
      </g>
    </svg>`;

    const design = importer.parseSvgString(svg, 'five_groups.svg');
    expect(design.parts.length).toBe(5);
    expect(design.parts[0].name).toContain('Design A');
    expect(design.parts[1].name).toContain('Design B');
  });

  it('Test 3 — One outer contour + two holes remains 1 Part with 2 holes', () => {
    const svg = `<svg width="200mm" height="200mm" viewBox="0 0 200 200">
      <rect x="0" y="0" width="100" height="100" />
      <circle cx="30" cy="30" r="10" />
      <circle cx="70" cy="70" r="10" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'outer_with_holes.svg');
    expect(design.parts.length).toBe(1);
    expect(design.parts[0].geometry.contours.length).toBe(1);
    expect(design.parts[0].geometry.holes.length).toBe(2);
  });

  it('Test 4 — Two independent designs, each with internal holes decompose into 2 Parts', () => {
    const svg = `<svg width="300mm" height="200mm" viewBox="0 0 300 200">
      <!-- Design 1 -->
      <g id="bracket_one">
        <rect x="0" y="0" width="80" height="80" />
        <circle cx="40" cy="40" r="15" />
      </g>
      <!-- Design 2 -->
      <g id="bracket_two">
        <rect x="150" y="0" width="80" height="80" />
        <circle cx="190" cy="40" r="15" />
      </g>
    </svg>`;

    const design = importer.parseSvgString(svg, 'two_designs_with_holes.svg');
    expect(design.parts.length).toBe(2);
    expect(design.parts[0].geometry.holes.length).toBe(1);
    expect(design.parts[1].geometry.holes.length).toBe(1);
  });

  it('Test 5 — Nested groups decompose without duplicate parts', () => {
    const svg = `<svg width="300mm" height="200mm" viewBox="0 0 300 200">
      <g id="main_wrapper">
        <g id="sub_wrapper">
          <g id="product_alpha">
            <rect x="10" y="10" width="50" height="50" />
          </g>
          <g id="product_beta">
            <circle cx="150" cy="50" r="30" />
          </g>
        </g>
      </g>
    </svg>`;

    const design = importer.parseSvgString(svg, 'nested_groups.svg');
    expect(design.parts.length).toBe(2);
  });

  it('Test 6 — Transformed groups preserve geometry and dimensions correctly', () => {
    const svg = `<svg width="300mm" height="300mm" viewBox="0 0 300 300">
      <g transform="translate(50, 50) scale(2) rotate(90, 25, 25)">
        <rect x="0" y="0" width="50" height="50" />
      </g>
    </svg>`;

    const design = importer.parseSvgString(svg, 'transformed.svg');
    expect(design.parts.length).toBe(1);
    // 50 x 2 = 100 mm width and height
    expect(design.parts[0].width).toBeCloseTo(100, 1);
    expect(design.parts[0].height).toBeCloseTo(100, 1);
  });

  it('Test 7 — Ungrouped disconnected geometry decomposes cleanly', () => {
    const svg = `<svg width="300mm" height="300mm" viewBox="0 0 300 300">
      <path d="M 10 10 L 60 10 L 60 60 L 10 60 Z" />
      <path d="M 150 150 L 200 150 L 200 200 L 150 200 Z" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'ungrouped_disconnected.svg');
    expect(design.parts.length).toBe(2);
  });

  it('Test 8 — One design with disconnected elements wrapped in explicit group remains 1 Part', () => {
    const svg = `<svg width="300mm" height="300mm" viewBox="0 0 300 300">
      <g id="letter_a_stencil">
        <!-- Left leg -->
        <polygon points="10,100 30,100 40,10 20,10" />
        <!-- Right leg -->
        <polygon points="50,100 70,100 60,10 40,10" />
        <!-- Crossbar -->
        <rect x="25" y="50" width="30" height="10" />
      </g>
    </svg>`;

    const design = importer.parseSvgString(svg, 'letter_a.svg');
    expect(design.parts.length).toBe(1);
    expect(design.parts[0].geometry.contours.length).toBe(3);
  });

  it('Test 9 — Mixed SVG with holes and independent paths decomposes to 4 Parts', () => {
    const svg = `<svg width="600mm" height="300mm" viewBox="0 0 600 300">
      <!-- Design A + holes -->
      <g id="design_a">
        <rect x="10" y="10" width="80" height="80" />
        <circle cx="30" cy="30" r="5" />
      </g>
      <!-- Design B -->
      <circle cx="150" cy="50" r="30" id="design_b" />
      <!-- Design C + holes -->
      <g id="design_c">
        <rect x="220" y="10" width="90" height="90" />
        <circle cx="250" cy="40" r="10" />
      </g>
      <!-- Design D -->
      <rect x="350" y="10" width="60" height="40" id="design_d" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'mixed.svg');
    expect(design.parts.length).toBe(4);
  });

  it('Test 10 — Verification of full Canvas & Part operations (Select, Move, Rotate, Lock, Duplicate, Delete, Nesting)', async () => {
    const svg = `<svg width="400mm" height="400mm" viewBox="0 0 400 400">
      <rect x="10" y="10" width="40" height="40" id="p1" />
      <rect x="100" y="10" width="40" height="40" id="p2" />
      <rect x="200" y="10" width="40" height="40" id="p3" />
      <rect x="300" y="10" width="40" height="40" id="p4" />
      <rect x="10" y="100" width="40" height="40" id="p5" />
    </svg>`;

    const design = importer.parseSvgString(svg, 'multi_workspace.svg');
    expect(design.parts.length).toBe(5);

    const store = useNestStore.getState();
    store.addImportedDesign(design);

    let parts = useNestStore.getState().parts;
    expect(parts.length).toBe(5);

    const part1 = parts[0];
    const part2 = parts[1];

    // 1. Select
    store.selectPart(part1.id);
    expect(useNestStore.getState().selectedPartIds).toEqual([part1.id]);

    // 2. Move Part 1 independently
    const origPos2 = { ...part2.position };
    store.movePart(part1.id, 50, 50);
    parts = useNestStore.getState().parts;
    expect(parts.find((p) => p.id === part1.id)?.position).toEqual({ x: 50, y: 50 });
    // Part 2 did not move
    expect(parts.find((p) => p.id === part2.id)?.position).toEqual(origPos2);

    // 3. Rotate Part 1 independently
    const origRot2 = parts.find((p) => p.id === part2.id)?.rotation;
    store.rotatePart(part1.id);
    parts = useNestStore.getState().parts;
    expect(parts.find((p) => p.id === part1.id)?.rotation).toBe(90);
    expect(parts.find((p) => p.id === part2.id)?.rotation).toBe(origRot2);

    // 4. Lock Part 1
    store.toggleLockPart(part1.id);
    parts = useNestStore.getState().parts;
    expect(parts.find((p) => p.id === part1.id)?.locked).toBe(true);
    expect(parts.find((p) => p.id === part2.id)?.locked).toBe(false);

    // 5. Quantity update
    store.updatePartQuantity(part1.id, 3);
    parts = useNestStore.getState().parts;
    expect(parts.find((p) => p.id === part1.id)?.quantity).toBe(3);

    // 6. Duplicate Part 1
    store.duplicateParts([part1.id]);
    parts = useNestStore.getState().parts;
    expect(parts.length).toBe(6);

    // 7. Delete Part 2
    store.removeParts([part2.id]);
    parts = useNestStore.getState().parts;
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.id === part2.id)).toBeUndefined();

    // 8. Auto Nesting with locked parts
    await store.startAutoNesting();
    parts = useNestStore.getState().parts;
    expect(parts.length).toBeGreaterThanOrEqual(5);
  });

  describe('Section 13 — Shape-Independent Physical Design Decomposition Tests', () => {
    it('Example A — Circle + internal details = 1 Part', () => {
      const svg = `<svg width="200mm" height="200mm" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" />
        <circle cx="100" cy="100" r="30" />
        <rect x="90" y="50" width="20" height="20" />
      </svg>`;
      const design = importer.parseSvgString(svg, 'circle_details.svg');
      expect(design.parts.length).toBe(1);
    });

    it('Example B — Star + internal details = 1 Part', () => {
      const svg = `<svg width="200mm" height="200mm" viewBox="0 0 200 200">
        <polygon points="100,10 120,70 180,70 130,110 150,170 100,130 50,170 70,110 20,70 80,70" />
        <circle cx="100" cy="100" r="15" />
      </svg>`;
      const design = importer.parseSvgString(svg, 'star_details.svg');
      expect(design.parts.length).toBe(1);
    });

    it('Example C — Heart + internal details = 1 Part', () => {
      const svg = `<svg width="200mm" height="200mm" viewBox="0 0 200 200">
        <path d="M 100 160 C 20 100 20 40 70 30 C 90 25 100 45 100 45 C 100 45 110 25 130 30 C 180 40 180 100 100 160 Z" />
        <circle cx="70" cy="70" r="10" />
        <circle cx="130" cy="70" r="10" />
      </svg>`;
      const design = importer.parseSvgString(svg, 'heart_details.svg');
      expect(design.parts.length).toBe(1);
    });

    it('Example D — Irregular custom contour + internal details = 1 Part', () => {
      const svg = `<svg width="300mm" height="300mm" viewBox="0 0 300 300">
        <path d="M 50 20 L 180 40 L 220 150 L 170 260 L 60 220 L 20 110 Z" />
        <circle cx="100" cy="100" r="15" />
        <rect x="130" y="140" width="30" height="30" />
      </svg>`;
      const design = importer.parseSvgString(svg, 'irregular_details.svg');
      expect(design.parts.length).toBe(1);
    });

    it('Example E — Circle + Star = 2 Parts', () => {
      const svg = `<svg width="400mm" height="200mm" viewBox="0 0 400 200">
        <!-- Circle -->
        <circle cx="80" cy="80" r="60" />
        <!-- Star -->
        <polygon points="280,20 300,80 360,80 310,120 330,180 280,140 230,180 250,120 200,80 260,80" />
      </svg>`;
      const design = importer.parseSvgString(svg, 'circle_and_star.svg');
      expect(design.parts.length).toBe(2);
    });

    it('Example F — Star + Heart + Rectangle = 3 Parts', () => {
      const svg = `<svg width="600mm" height="200mm" viewBox="0 0 600 200">
        <!-- Star -->
        <polygon points="80,10 100,60 150,60 110,95 125,145 80,115 35,145 50,95 10,60 60,60" />
        <!-- Heart -->
        <path d="M 280 150 C 220 100 220 50 260 40 C 275 35 280 50 280 50 C 280 50 285 35 300 40 C 340 50 340 100 280 150 Z" />
        <!-- Rectangle -->
        <rect x="420" y="30" width="100" height="120" />
      </svg>`;
      const design = importer.parseSvgString(svg, 'three_shapes.svg');
      expect(design.parts.length).toBe(3);
    });

    it('Example G — Four completely different shapes each with internal geometry = 4 Parts', () => {
      const svg = `<svg width="800mm" height="300mm" viewBox="0 0 800 300">
        <!-- Shape 1: Circle with hole -->
        <g id="part_circle">
          <circle cx="80" cy="80" r="60" />
          <circle cx="80" cy="80" r="20" />
        </g>
        <!-- Shape 2: Star with hole -->
        <g id="part_star">
          <polygon points="280,10 300,60 350,60 310,95 125,145 280,115 235,145 250,95 210,60 260,60" />
          <circle cx="280" cy="80" r="10" />
        </g>
        <!-- Shape 3: Heart with hole -->
        <g id="part_heart">
          <path d="M 480 150 C 420 100 420 50 460 40 C 475 35 480 50 480 50 C 480 50 485 35 500 40 C 540 50 540 100 480 150 Z" />
          <circle cx="480" cy="80" r="10" />
        </g>
        <!-- Shape 4: Irregular Polygon with hole -->
        <g id="part_polygon">
          <polygon points="620,20 750,40 780,160 650,180" />
          <rect x="670" y="70" width="40" height="40" />
        </g>
      </svg>`;
      const design = importer.parseSvgString(svg, 'four_different_shapes.svg');
      expect(design.parts.length).toBe(4);
    });
  });
});
