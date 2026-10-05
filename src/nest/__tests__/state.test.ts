import { describe, it, expect, beforeEach } from 'vitest';
import { useNestStore } from '../state/useNestStore';

describe('Nest Workspace State & History', () => {
  beforeEach(() => {
    useNestStore.setState({
      sheet: {
        id: 'test-sheet',
        name: 'Test Sheet',
        width: 600,
        height: 300,
        margin: 5,
        spacing: 3,
      },
      parts: [],
      selectedPartIds: [],
      history: [
        {
          sheet: {
            id: 'test-sheet',
            name: 'Test Sheet',
            width: 600,
            height: 300,
            margin: 5,
            spacing: 3,
          },
          sheets: [
            {
              id: 'test-sheet',
              name: 'Test Sheet',
              width: 600,
              height: 300,
              margin: 5,
              spacing: 3,
            },
          ],
          parts: [],
        },
      ],
      historyIndex: 0,
    });
  });

  it('adds imported design parts to workspace state', () => {
    const store = useNestStore.getState();
    store.addImportedDesign({
      fileName: 'bracket.svg',
      parts: [
        {
          geometry: {
            contours: [
              [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 50, y: 50 },
                { x: 0, y: 50 },
              ],
            ],
            holes: [],
            bounds: { minX: 0, minY: 0, maxX: 50, maxY: 50, width: 50, height: 50 },
            area: 2500,
          },
          width: 50,
          height: 50,
          area: 2500,
          name: 'Bracket Part',
        },
      ],
    });

    const updated = useNestStore.getState();
    expect(updated.parts.length).toBe(1);
    expect(updated.parts[0].name).toBe('Bracket Part');
    expect(updated.parts[0].position.x).toBe(10); // Placed initial offset 10
  });

  it('handles duplicate, quantity update, and remove actions', () => {
    const store = useNestStore.getState();
    store.addImportedDesign({
      fileName: 'test.svg',
      parts: [
        {
          geometry: {
            contours: [
              [
                { x: 0, y: 0 },
                { x: 20, y: 0 },
                { x: 20, y: 20 },
                { x: 0, y: 20 },
              ],
            ],
            holes: [],
            bounds: { minX: 0, minY: 0, maxX: 20, maxY: 20, width: 20, height: 20 },
            area: 400,
          },
          width: 20,
          height: 20,
          area: 400,
        },
      ],
    });

    let state = useNestStore.getState();
    const partId = state.parts[0].id;

    // Update quantity
    state.updatePartQuantity(partId, 5);
    state = useNestStore.getState();
    expect(state.parts[0].quantity).toBe(5);

    // Duplicate part
    state.duplicateParts([partId]);
    state = useNestStore.getState();
    expect(state.parts.length).toBe(2);

    // Remove first part
    state.removeParts([partId]);
    state = useNestStore.getState();
    expect(state.parts.length).toBe(1);
  });

  it('supports undo and redo operations', () => {
    const store = useNestStore.getState();
    store.addImportedDesign({
      fileName: 'part1.svg',
      parts: [
        {
          geometry: {
            contours: [
              [
                { x: 0, y: 0 },
                { x: 30, y: 0 },
                { x: 30, y: 30 },
                { x: 0, y: 30 },
              ],
            ],
            holes: [],
            bounds: { minX: 0, minY: 0, maxX: 30, maxY: 30, width: 30, height: 30 },
            area: 900,
          },
          width: 30,
          height: 30,
          area: 900,
        },
      ],
    });

    let state = useNestStore.getState();
    expect(state.parts.length).toBe(1);
    expect(state.canUndo()).toBe(true);

    // Perform Undo
    state.undo();
    state = useNestStore.getState();
    expect(state.parts.length).toBe(0);

    // Perform Redo
    state.redo();
    state = useNestStore.getState();
    expect(state.parts.length).toBe(1);
  });
});
