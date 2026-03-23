/**
 * Canvas setup, dirty-flag render loop, drawing.
 */

import { getDiscStyle, DISC_RADIUS, drawDiscShape, drawSelectionRing } from './disc.js';
import { drawToolbox, TOOLBOX_WIDTH } from './toolbox.js';
import { isDark } from './theme.js';
import { drawGrid } from './grid.js';
import { drawToolbar, TOOLBAR_HEIGHT, TOOLBAR_MARGIN } from './toolbar.js';

const WS_BG_LIGHT = '#F8FAFB';
const WS_BG_DARK = '#0F172A';

const MARQUEE_LIGHT = { stroke: '#3B82F6', fill: 'rgba(59,130,246,0.08)' };
const MARQUEE_DARK = { stroke: '#60A5FA', fill: 'rgba(96,165,250,0.12)' };

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
  dirty = false;
  markDirty();
}

// Providers set by main.js
let getState = null;
let getDragGhost = null;
let getMarquee = null;

export function setStateProvider(fn) { getState = fn; }
export function setDragGhostProvider(fn) { getDragGhost = fn; }
export function setMarqueeProvider(fn) { getMarquee = fn; }

function draw() {
  const state = getState();
  if (!state) return;

  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;
  const dark = isDark();

  // Clear
  ctx.fillStyle = dark ? WS_BG_DARK : WS_BG_LIGHT;
  ctx.fillRect(0, 0, w, h);

  const vx = state.viewport.x;
  const vy = state.viewport.y;

  // Grid lines (behind discs)
  if (state.gridEnabled) {
    drawGrid(ctx, w, h, vx, vy);
  }

  // Draw workspace discs
  for (const disc of state.discs) {
    const sx = disc.x + vx;
    const sy = disc.y + vy;

    if (sx + DISC_RADIUS < TOOLBOX_WIDTH || sx - DISC_RADIUS > w ||
        sy + DISC_RADIUS < 0 || sy - DISC_RADIUS > h) {
      continue;
    }

    // Selection ring (drawn behind disc body)
    if (state.selection[disc.id]) {
      drawSelectionRing(ctx, sx, sy, DISC_RADIUS);
    }

    const style = getDiscStyle(disc.type, disc.side, dark);
    drawDiscShape(ctx, sx, sy, DISC_RADIUS, style);
  }

  // Marquee rectangle
  const marquee = getMarquee ? getMarquee() : null;
  if (marquee) {
    const m = dark ? MARQUEE_DARK : MARQUEE_LIGHT;
    const mx = Math.min(marquee.x1, marquee.x2);
    const my = Math.min(marquee.y1, marquee.y2);
    const mw = Math.abs(marquee.x2 - marquee.x1);
    const mh = Math.abs(marquee.y2 - marquee.y1);

    ctx.fillStyle = m.fill;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = m.stroke;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(mx, my, mw, mh);
    ctx.setLineDash([]);
  }

  // Drag ghost
  const ghost = getDragGhost ? getDragGhost() : null;
  if (ghost) {
    const style = getDiscStyle(ghost.type, ghost.side, dark);
    ctx.globalAlpha = 0.85;
    drawDiscShape(ctx, ghost.screenX, ghost.screenY, DISC_RADIUS, style);
    ctx.globalAlpha = 1;
  }

  // Fixed UI layers (screen space)
  drawToolbox(ctx, h);
  drawToolbar(ctx, w, state);
}
