/**
 * Workspace state model — snapshot-friendly (plain objects, deep-cloneable).
 */

import { createDisc, flipDisc, DISC_RADIUS } from './disc.js';

export function createState() {
  return {
    discs: [],
    viewport: { x: 0, y: 0 },
    nextId: 1,
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

export function removeDisc(state, id) {
  return {
    ...state,
    discs: state.discs.filter(d => d.id !== id),
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

export function getDiscCount(state) {
  return state.discs.length;
}
