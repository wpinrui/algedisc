/**
 * Grid snap logic and grid line drawing.
 */

import { isDark } from './theme.js';

export const GRID_SIZE = 70;

const GRID_COLOR_LIGHT = '#CBD5E1';
const GRID_COLOR_DARK = '#334155';

/** Snap a world coordinate to the nearest grid point. */
export function snapToGrid(x, y) {
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  };
}

/** Draw grid lines on the canvas. Accounts for viewport offset. */
export function drawGrid(ctx, w, h, vx, vy) {
  ctx.strokeStyle = isDark() ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Vertical lines
  const startX = ((vx % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  for (let x = startX; x <= w; x += GRID_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }

  // Horizontal lines
  const startY = ((vy % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  for (let y = startY; y <= h; y += GRID_SIZE) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }

  ctx.stroke();
}
