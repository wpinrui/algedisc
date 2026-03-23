/**
 * Entry point — init, event handling, interaction state machine.
 */

import {
  createState, addDisc, moveDisc, flipDiscById,
  bringToFront, setViewport, hitTestDisc, getDiscCount,
} from './workspace.js';
import {
  initCanvas, markDirty, startRenderLoop,
  setStateProvider, setDragGhostProvider,
} from './canvas.js';
import { hitTestToolbox, TOOLBOX_WIDTH } from './toolbox.js';

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
  PANNING: 'PANNING',
};

let mode = Mode.IDLE;

// Drag state
let dragDiscId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Toolbox drag ghost (screen coords)
let dragGhost = null;

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

let canvasEl = null;

function getMousePos(e) {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

// ── Event handlers ──
function onMouseDown(e) {
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

  // Left-click only
  if (e.button !== 0) return;

  // Check toolbox hit first
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
    mode = Mode.DRAGGING_DISC;
    dragDiscId = disc.id;
    dragOffsetX = disc.x - world.x;
    dragOffsetY = disc.y - world.y;
    // Bring to front
    setState(bringToFront(state, disc.id));
    return;
  }
}

function onMouseMove(e) {
  const pos = getMousePos(e);

  // Check if mouse has moved beyond threshold
  const dx = pos.x - mouseDownPos.x;
  const dy = pos.y - mouseDownPos.y;
  if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) {
    hasMoved = true;
  }

  if (mode === Mode.DRAGGING_FROM_TOOLBOX && dragGhost) {
    dragGhost = { ...dragGhost, screenX: pos.x, screenY: pos.y };
    markDirty();
    return;
  }

  if (mode === Mode.DRAGGING_DISC && dragDiscId != null) {
    const world = screenToWorld(pos.x, pos.y);
    setState(moveDisc(state, dragDiscId, world.x + dragOffsetX, world.y + dragOffsetY));
    return;
  }

  if (mode === Mode.PANNING) {
    const pdx = pos.x - panStartX;
    const pdy = pos.y - panStartY;
    setState(setViewport(state, panStartVX + pdx, panStartVY + pdy));
    return;
  }
}

function onMouseUp(e) {
  const pos = getMousePos(e);

  if (mode === Mode.DRAGGING_FROM_TOOLBOX && dragGhost) {
    // Drop disc on workspace if outside toolbox
    if (pos.x > TOOLBOX_WIDTH) {
      const world = screenToWorld(pos.x, pos.y);
      setState(addDisc(state, dragGhost.type, world.x, world.y, dragGhost.side));
    }
    dragGhost = null;
    mode = Mode.IDLE;
    markDirty();
    return;
  }

  if (mode === Mode.DRAGGING_DISC) {
    // If no significant movement, treat as click (potential double-click for flip)
    if (!hasMoved && dragDiscId != null) {
      const now = Date.now();
      if (lastClickDiscId === dragDiscId && (now - lastClickTime) < DOUBLE_CLICK_MS) {
        // Double-click → flip
        setState(flipDiscById(state, dragDiscId));
        lastClickDiscId = null;
        lastClickTime = 0;
      } else {
        lastClickDiscId = dragDiscId;
        lastClickTime = now;
      }
    }
    dragDiscId = null;
    mode = Mode.IDLE;
    return;
  }

  if (mode === Mode.PANNING) {
    mode = Mode.IDLE;
    return;
  }
}

function onContextMenu(e) {
  e.preventDefault();
}

// ── Status bar ──
function updateStatus() {
  const count = getDiscCount(state);
  const leftEl = document.getElementById('status-left');
  const rightEl = document.getElementById('status-right');
  if (leftEl) leftEl.textContent = '';
  if (rightEl) rightEl.textContent = `Discs: ${count}`;
}

// ── Init ──
function init() {
  canvasEl = document.getElementById('workspace-canvas');

  // Prevent context menu on canvas
  canvasEl.addEventListener('contextmenu', onContextMenu);

  // Mouse events
  canvasEl.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Wire up canvas
  setStateProvider(() => state);
  setDragGhostProvider(() => dragGhost);
  initCanvas(canvasEl);
  startRenderLoop();
  updateStatus();
}

document.addEventListener('DOMContentLoaded', init);
