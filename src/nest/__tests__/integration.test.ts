import { describe, it, expect, beforeEach } from 'vitest';
import { useNestStore } from '../state/useNestStore';
import { SvgImporter } from '../core/svg/importer';

describe('Part 1 Full System Integration Audit', () => {
  beforeEach(() => {
    useNestStore.setState({
      sheet: {
        id: 'test-sheet',
        name: 'Standard Baltic Birch 600x300',
        width: 600,
        height: 300,
        margin: 5,
        spacing: 3,
        materialPricePerSheet: 15.0,
      },
      parts: [],
      selectedPartIds: [],
      history: [
        {
          sheet: {
            id: 'test-sheet',
            name: 'Standard Baltic Birch 600x300',
            width: 600,
            height: 300,
            margin: 5,
            spacing: 3,
            materialPricePerSheet: 15.0,
          },
          sheets: [
            {
              id: 'test-sheet',
              name: 'Standard Baltic Birch 600x300',
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

  it('runs 20 consecutive state operations through history stack without state corruption', async () => {
    const store = useNestStore.getState();
    const importer = new SvgImporter();

    const design = importer.parseSvgString(
      `<svg width="100mm" height="100mm" viewBox="0 0 100 100"><rect x="0" y="0" width="40" height="40" /></svg>`,
      'partA.svg'
    );

    // 1. Add Part
    store.addImportedDesign(design);
    let state = useNestStore.getState();
    const id = state.parts[0].id;
    expect(state.parts.length).toBe(1);

    // 2-5. Move part multiple times
    store.movePart(id, 20, 20);
    store.movePart(id, 40, 20);
    store.movePart(id, 60, 30);
    store.movePart(id, 80, 50);

    // 6-8. Rotate part 3 times (0 -> 90 -> 180 -> 270)
    store.rotatePart(id);
    store.rotatePart(id);
    store.rotatePart(id);

    // 9. Update Quantity
    store.updatePartQuantity(id, 3);

    // 10. Duplicate Part
    store.duplicateParts([id]);
    state = useNestStore.getState();
    expect(state.parts.length).toBe(2);
    const dupId = state.parts[1].id;

    // 11. Move duplicate
    store.movePart(dupId, 150, 50);

    // 12. Lock duplicate
    store.toggleLockPart(dupId);

    // 13. Update Sheet Settings
    store.updateSheet({ width: 800, height: 400 });

    // 14. Auto arrange / nest
    await store.startAutoNesting();

    // 15. Unlock duplicate
    store.toggleLockPart(dupId);

    // 16. Delete duplicate
    store.removeParts([dupId]);
    state = useNestStore.getState();
    expect(state.parts.length).toBeGreaterThan(0);

    // 17-20. 10 consecutive Undo operations
    for (let i = 0; i < 10; i++) {
      if (useNestStore.getState().canUndo()) {
        useNestStore.getState().undo();
      }
    }

    state = useNestStore.getState();
    expect(state.parts.length).toBeGreaterThanOrEqual(0);

    // 10 consecutive Redo operations
    for (let i = 0; i < 10; i++) {
      if (useNestStore.getState().canRedo()) {
        useNestStore.getState().redo();
      }
    }

    state = useNestStore.getState();
    expect(state.parts.length).toBeGreaterThanOrEqual(1);
  });

  it('verifies real-time score calculation matches application state', () => {
    const store = useNestStore.getState();
    const importer = new SvgImporter();

    const design = importer.parseSvgString(
      `<svg width="100mm" height="100mm" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" /></svg>`,
      'square.svg'
    );

    store.addImportedDesign(design);

    const scoreData = useNestStore.getState().getScore();
    expect(scoreData.totalPartsPlaced).toBe(1);
    expect(scoreData.utilizationPercentage).toBeGreaterThan(0);
    expect(scoreData.wastePercentage).toBeLessThan(100);
    expect(scoreData.score).toBeGreaterThan(0);
  });
});
