/**
 * Workspace state model — snapshot-friendly (plain objects, deep-cloneable).
 */

import { createDisc, flipDisc, DISC_RADIUS } from './disc.js';

export function createState() {
  return {
    discs: [],
    viewport: { x: 0, y: 0 },
    nextId: 1,
    selection: {},
    gridEnabled: false,
  };
}

export function addDisc(state, type, x, y, side) {
  const disc = createDisc(state.nextId, type, x, y, side);
  return {
    ...state,
    discs: [...state.discs, disc],
    nextId: state.nextId + 1,
  };
}

export function moveDisc(state, id, x, y) {
  return {
    ...state,
    discs: state.discs.map(d => d.id === id ? { ...d, x, y } : d),
  };
}

export function flipDiscById(state, id) {
  return {
    ...state,
    discs: state.discs.map(d => d.id === id ? flipDisc(d) : d),
  };
}

/** Move disc to top of z-order (end of array). */
export function bringToFront(state, id) {
  const disc = state.discs.find(d => d.id === id);
  if (!disc) return state;
  return {
    ...state,
    discs: [...state.discs.filter(d => d.id !== id), disc],
  };
}

export function setViewport(state, x, y) {
  return {
    ...state,
    viewport: { x, y },
  };
}

/** Hit-test: find topmost disc at world coordinate (wx, wy). Reverse iteration for z-order. */
export function hitTestDisc(state, wx, wy) {
  for (let i = state.discs.length - 1; i >= 0; i--) {
    const d = state.discs[i];
    const dx = d.x - wx;
    const dy = d.y - wy;
    if (dx * dx + dy * dy <= DISC_RADIUS * DISC_RADIUS) {
      return d;
    }
  }
  return null;
}

// ── Selection (plain object { [id]: true } — JSON-serializable) ──

export function selectDisc(state, id) {
  return { ...state, selection: { ...state.selection, [id]: true } };
}

export function deselectDisc(state, id) {
  const sel = { ...state.selection };
  delete sel[id];
  return { ...state, selection: sel };
}

export function toggleSelectDisc(state, id) {
  if (state.selection[id]) return deselectDisc(state, id);
  return selectDisc(state, id);
}

export function setSelection(state, ids) {
  const sel = {};
  for (const id of ids) sel[id] = true;
  return { ...state, selection: sel };
}

export function clearSelection(state) {
  return { ...state, selection: {} };
}

export function isSelected(state, id) {
  return !!state.selection[id];
}

export function selectionSize(state) {
  return Object.keys(state.selection).length;
}

export function getSelectedIds(state) {
  return Object.keys(state.selection).map(Number);
}

/** Select all discs whose center falls within the given world-space rect. */
export function selectDiscsInRect(state, x1, y1, x2, y2) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  return state.discs
    .filter(d => d.x >= minX && d.x <= maxX && d.y >= minY && d.y <= maxY)
    .map(d => d.id);
}

// ── Bulk operations ──

export function moveSelectedDiscs(state, dx, dy) {
  return {
    ...state,
    discs: state.discs.map(d =>
      state.selection[d.id] ? { ...d, x: d.x + dx, y: d.y + dy } : d
    ),
  };
}

export function deleteSelected(state) {
  return {
    ...state,
    discs: state.discs.filter(d => !state.selection[d.id]),
    selection: {},
  };
}

// ── Grid ──

export function toggleGrid(state) {
  return { ...state, gridEnabled: !state.gridEnabled };
}

export function getDiscCount(state) {
  return state.discs.length;
}
