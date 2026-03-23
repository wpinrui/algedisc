/**
 * Canvas setup, dirty-flag render loop, drawing.
 */

import { getDiscStyle, DISC_RADIUS, drawDiscShape } from './disc.js';
import { drawToolbox, TOOLBOX_WIDTH } from './toolbox.js';
import { isDark } from './theme.js';

const WS_BG_LIGHT = '#F8FAFB';
const WS_BG_DARK = '#0F172A';

let canvas, ctx;
let dirty = true;

export function initCanvas(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    markDirty();
  });
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

export function markDirty() {
  if (!dirty) {
    dirty = true;
    requestAnimationFrame(renderFrame);
  }
}

function renderFrame() {
  if (!dirty) return;
  dirty = false;
  draw();
}

/** Start the render loop — draws once immediately. */
export function startRenderLoop() {
  dirty = false; // Reset so markDirty schedules a frame
  markDirty();
}

// Will be set by main.js
let getState = null;
let getDragGhost = null;

export function setStateProvider(fn) { getState = fn; }
export function setDragGhostProvider(fn) { getDragGhost = fn; }

function draw() {
  const state = getState();
  if (!state) return;

  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;

  const dark = isDark();

  // Clear
  ctx.fillStyle = dark ? WS_BG_DARK : WS_BG_LIGHT;
  ctx.fillRect(0, 0, w, h);

  // Draw workspace discs (in world space, offset by viewport)
  const vx = state.viewport.x;
  const vy = state.viewport.y;

  for (const disc of state.discs) {
    const sx = disc.x + vx;
    const sy = disc.y + vy;

    // Skip discs outside visible area (with margin)
    if (sx + DISC_RADIUS < TOOLBOX_WIDTH || sx - DISC_RADIUS > w ||
        sy + DISC_RADIUS < 0 || sy - DISC_RADIUS > h) {
      continue;
    }

    const style = getDiscStyle(disc.type, disc.side, dark);
    drawDiscShape(ctx, sx, sy, DISC_RADIUS, style);
  }

  // Draw drag ghost (disc being dragged from toolbox)
  const ghost = getDragGhost ? getDragGhost() : null;
  if (ghost) {
    const style = getDiscStyle(ghost.type, ghost.side, dark);
    ctx.globalAlpha = 0.85;
    drawDiscShape(ctx, ghost.screenX, ghost.screenY, DISC_RADIUS, style);
    ctx.globalAlpha = 1;
  }

  // Draw toolbox on top (fixed screen space)
  drawToolbox(ctx, h);
}
