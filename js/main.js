/**
 * Entry point — init, event handling, interaction state machine.
 */

import {
  createState, addDisc, moveDisc, moveSelectedDiscs, flipDiscById,
  bringToFront, setViewport, hitTestDisc, getDiscCount,
  selectDisc, deselectDisc, toggleSelectDisc, setSelection,
  clearSelection, isSelected, selectionSize, selectDiscsInRect,
  deleteSelected, toggleGrid,
} from './workspace.js';
import {
  initCanvas, markDirty, startRenderLoop,
  setStateProvider, setDragGhostProvider, setMarqueeProvider,
} from './canvas.js';
import { hitTestToolbox, TOOLBOX_WIDTH } from './toolbox.js';
import { hitTestToolbar, getToolbarCanvasWidth } from './toolbar.js';
import { DISC_RADIUS } from './disc.js';
import { initTheme, toggle as toggleTheme, isDark, onChange as onThemeChange } from './theme.js';
import { snapToGrid } from './grid.js';

// ── State ──
let state = createState();

function setState(newState) {
  state = newState;
  markDirty();
  updateStatus();
}

// ── Interaction state machine ──
const Mode = {
  IDLE: 'IDLE',
  DRAGGING_FROM_TOOLBOX: 'DRAGGING_FROM_TOOLBOX',
  DRAGGING_DISC: 'DRAGGING_DISC',
  DRAGGING_SELECTION: 'DRAGGING_SELECTION',
  MARQUEE: 'MARQUEE',
  PANNING: 'PANNING',
};

let mode = Mode.IDLE;

// Drag state
let dragDiscId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Bulk drag state
let bulkDragStartWorld = null;
let bulkDragLastWorld = null;

// Toolbox drag ghost (screen coords)
let dragGhost = null;

// Marquee state (screen coords)
let marquee = null;
let marqueeCtrlHeld = false;
let marqueePreSelection = null;

// Pan state
let panStartX = 0;
let panStartY = 0;
let panStartVX = 0;
let panStartVY = 0;

// Click/double-click detection
const MOVE_THRESHOLD = 5;
let mouseDownPos = { x: 0, y: 0 };
let hasMoved = false;
let lastClickTime = 0;
let lastClickDiscId = null;
const DOUBLE_CLICK_MS = 350;

// ── Coordinate conversion ──
function screenToWorld(sx, sy) {
  return {
    x: sx - state.viewport.x,
    y: sy - state.viewport.y,
  };
}

function clampWorldX(wx) {
  const minScreenX = TOOLBOX_WIDTH + DISC_RADIUS;
  const minWorldX = minScreenX - state.viewport.x;
  return Math.max(wx, minWorldX);
}

let canvasEl = null;

function getMousePos(e) {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function getCanvasWidth() {
  return canvasEl.width / devicePixelRatio;
}

// ── Event handlers ──
function onMouseDown(e) {
  if (mode !== Mode.IDLE) return;

  const pos = getMousePos(e);
  mouseDownPos = { x: pos.x, y: pos.y };
  hasMoved = false;

  // Right-click → pan
  if (e.button === 2) {
    mode = Mode.PANNING;
    panStartX = pos.x;
    panStartY = pos.y;
    panStartVX = state.viewport.x;
    panStartVY = state.viewport.y;
    e.preventDefault();
    return;
  }

  if (e.button !== 0) return;

  // Check toolbar hit
  const tbHit = hitTestToolbar(pos.x, pos.y, getCanvasWidth());
  if (tbHit === 'grid') {
    setState(toggleGrid(state));
    return;
  }
  if (tbHit === 'delete') {
    if (selectionSize(state) > 0) {
      setState(deleteSelected(state));
    }
    return;
  }

  // Check toolbox hit
  if (pos.x <= TOOLBOX_WIDTH) {
    const toolboxHit = hitTestToolbox(pos.x, pos.y);
    if (toolboxHit) {
      mode = Mode.DRAGGING_FROM_TOOLBOX;
      dragGhost = {
        type: toolboxHit.type,
        side: toolboxHit.side,
        screenX: pos.x,
        screenY: pos.y,
      };
      markDirty();
      return;
    }
    return;
  }

  // Check workspace disc hit
  const world = screenToWorld(pos.x, pos.y);
  const disc = hitTestDisc(state, world.x, world.y);

  if (disc) {
    if (e.ctrlKey) {
      // Ctrl-click: toggle selection
      setState(toggleSelectDisc(state, disc.id));
      return;
    }

    if (isSelected(state, disc.id) && selectionSize(state) > 1) {
      // Drag selected group
      mode = Mode.DRAGGING_SELECTION;
      bulkDragStartWorld = { x: world.x, y: world.y };
      bulkDragLastWorld = { x: world.x, y: world.y };
      return;
    }

    // Single disc drag
    mode = Mode.DRAGGING_DISC;
    dragDiscId = disc.id;
    dragOffsetX = disc.x - world.x;
    dragOffsetY = disc.y - world.y;
    // Select only this disc and bring to front
    let s = clearSelection(state);
    s = selectDisc(s, disc.id);
    s = bringToFront(s, disc.id);
    setState(s);
    return;
  }

  // Empty space → marquee
  mode = Mode.MARQUEE;
  marqueeCtrlHeld = e.ctrlKey;
  marqueePreSelection = marqueeCtrlHeld ? Object.keys(state.selection).map(Number) : [];
  marquee = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
  if (!marqueeCtrlHeld) {
    setState(clearSelection(state));
  }
  markDirty();
}

function updateCursor(pos) {
  if (mode === Mode.DRAGGING_DISC || mode === Mode.DRAGGING_FROM_TOOLBOX || mode === Mode.DRAGGING_SELECTION) {
    canvasEl.style.cursor = 'grabbing';
    return;
  }
  if (mode === Mode.PANNING) {
    canvasEl.style.cursor = 'move';
    return;
  }
  if (mode === Mode.MARQUEE) {
    canvasEl.style.cursor = 'crosshair';
    return;
  }
  // Idle
  const tbHit = hitTestToolbar(pos.x, pos.y, getCanvasWidth());
  if (tbHit) {
    canvasEl.style.cursor = 'pointer';
    return;
  }
  if (pos.x <= TOOLBOX_WIDTH) {
    const hit = hitTestToolbox(pos.x, pos.y);
    canvasEl.style.cursor = hit ? 'grab' : 'default';
    return;
  }
  const world = screenToWorld(pos.x, pos.y);
  const disc = hitTestDisc(state, world.x, world.y);
  canvasEl.style.cursor = disc ? 'grab' : 'default';
}

function onMouseMove(e) {
  const pos = getMousePos(e);

  const dx = pos.x - mouseDownPos.x;
  const dy = pos.y - mouseDownPos.y;
  if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) {
    hasMoved = true;
  }

  if (mode === Mode.DRAGGING_FROM_TOOLBOX && dragGhost) {
    dragGhost = { ...dragGhost, screenX: pos.x, screenY: pos.y };
    markDirty();
    updateCursor(pos);
    return;
  }

  if (mode === Mode.DRAGGING_DISC && dragDiscId != null) {
    const world = screenToWorld(pos.x, pos.y);
    const wx = clampWorldX(world.x + dragOffsetX);
    setState(moveDisc(state, dragDiscId, wx, world.y + dragOffsetY));
    updateCursor(pos);
    return;
  }

  if (mode === Mode.DRAGGING_SELECTION) {
    const world = screenToWorld(pos.x, pos.y);
    const ddx = world.x - bulkDragLastWorld.x;
    const ddy = world.y - bulkDragLastWorld.y;
    bulkDragLastWorld = { x: world.x, y: world.y };
    setState(moveSelectedDiscs(state, ddx, ddy));
    updateCursor(pos);
    return;
  }

  if (mode === Mode.MARQUEE && marquee) {
    marquee = { ...marquee, x2: pos.x, y2: pos.y };
    // Live preview: select discs in marquee rect
    const w1 = screenToWorld(marquee.x1, marquee.y1);
    const w2 = screenToWorld(marquee.x2, marquee.y2);
    const idsInRect = selectDiscsInRect(state, w1.x, w1.y, w2.x, w2.y);
    const combined = marqueeCtrlHeld
      ? [...new Set([...marqueePreSelection, ...idsInRect])]  // deduplicate
      : idsInRect;
    setState(setSelection(state, combined));
    markDirty();
    updateCursor(pos);
    return;
  }

  if (mode === Mode.PANNING) {
    const pdx = pos.x - panStartX;
    const pdy = pos.y - panStartY;
    setState(setViewport(state, panStartVX + pdx, panStartVY + pdy));
    updateCursor(pos);
    return;
  }

  updateCursor(pos);
}

function onMouseUp(e) {
  const pos = getMousePos(e);

  if (mode === Mode.DRAGGING_FROM_TOOLBOX && dragGhost) {
    if (pos.x > TOOLBOX_WIDTH) {
      const world = screenToWorld(pos.x, pos.y);
      let wx = clampWorldX(world.x);
      let wy = world.y;
      if (state.gridEnabled) {
        const snapped = snapToGrid(wx, wy);
        wx = snapped.x;
        wy = snapped.y;
      }
      setState(addDisc(state, dragGhost.type, wx, wy, dragGhost.side));
    }
    dragGhost = null;
    mode = Mode.IDLE;
    markDirty();
    updateCursor(pos);
    return;
  }

  if (mode === Mode.DRAGGING_DISC) {
    if (!hasMoved && dragDiscId != null) {
      const now = Date.now();
      if (lastClickDiscId === dragDiscId && (now - lastClickTime) < DOUBLE_CLICK_MS) {
        setState(flipDiscById(state, dragDiscId));
        lastClickDiscId = null;
        lastClickTime = 0;
      } else {
        lastClickDiscId = dragDiscId;
        lastClickTime = now;
      }
    } else if (state.gridEnabled && dragDiscId != null) {
      // Snap on drop
      const disc = state.discs.find(d => d.id === dragDiscId);
      if (disc) {
        const snapped = snapToGrid(disc.x, disc.y);
        setState(moveDisc(state, dragDiscId, clampWorldX(snapped.x), snapped.y));
      }
    }
    dragDiscId = null;
    mode = Mode.IDLE;
    updateCursor(pos);
    return;
  }

  if (mode === Mode.DRAGGING_SELECTION) {
    if (state.gridEnabled) {
      // Snap all selected discs on drop
      let s = state;
      for (const idStr of Object.keys(state.selection)) {
        const id = Number(idStr);
        const disc = s.discs.find(d => d.id === id);
        if (disc) {
          const snapped = snapToGrid(disc.x, disc.y);
          s = moveDisc(s, id, clampWorldX(snapped.x), snapped.y);
        }
      }
      setState(s);
    }
    bulkDragStartWorld = null;
    bulkDragLastWorld = null;
    mode = Mode.IDLE;
    updateCursor(pos);
    return;
  }

  if (mode === Mode.MARQUEE) {
    marquee = null;
    mode = Mode.IDLE;
    markDirty();
    updateCursor(pos);
    return;
  }

  if (mode === Mode.PANNING) {
    mode = Mode.IDLE;
    updateCursor(pos);
    return;
  }
}

function onKeyDown(e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectionSize(state) > 0) {
      e.preventDefault();
      setState(deleteSelected(state));
    }
  }
}

function onContextMenu(e) {
  e.preventDefault();
}

// ── Status bar ──
function updateStatus() {
  const count = getDiscCount(state);
  const sel = selectionSize(state);
  const leftEl = document.getElementById('status-left');
  const rightEl = document.getElementById('status-right');
  if (leftEl) leftEl.textContent = state.gridEnabled ? 'Grid: On' : '';
  if (rightEl) {
    const parts = [`Discs: ${count}`];
    if (sel > 0) parts.push(`Selected: ${sel}`);
    rightEl.textContent = parts.join('  |  ');
  }
}

// ── Theme toggle ──
function updateToggleIcon() {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isDark() ? '\u263E' : '\u263C';
}

// ── Init ──
function init() {
  initTheme();
  updateToggleIcon();
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) toggleBtn.addEventListener('click', () => { toggleTheme(); });
  onThemeChange(() => { updateToggleIcon(); markDirty(); });

  canvasEl = document.getElementById('workspace-canvas');

  canvasEl.addEventListener('contextmenu', onContextMenu);
  canvasEl.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);

  setStateProvider(() => state);
  setDragGhostProvider(() => dragGhost);
  setMarqueeProvider(() => marquee);
  initCanvas(canvasEl);
  startRenderLoop();
  updateStatus();
}

document.addEventListener('DOMContentLoaded', init);
