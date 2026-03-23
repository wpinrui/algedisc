/**
 * Toolbox strip — rendered on canvas, fixed screen position (not affected by pan).
 */

import { DiscType, DiscSide, getDiscStyle, TOOLBOX_DISC_RADIUS, drawDiscShape } from './disc.js';
import { isDark } from './theme.js';

export const TOOLBOX_WIDTH = 80;

const THEME = {
  light: { bg: '#EEF2F7', border: '#CBD5E1', label: '#94A3B8' },
  dark:  { bg: '#1E293B', border: '#334155', label: '#64748B' },
};
const TOOLBOX_PADDING_TOP = 18;
const TOOLBOX_GAP = 18;

// Toolbox items: one per disc type, positive side only
const TOOLBOX_ITEMS = [
  { type: DiscType.CONST, side: DiscSide.POSITIVE },
  { type: DiscType.LINEAR, side: DiscSide.POSITIVE },
  { type: DiscType.QUAD, side: DiscSide.POSITIVE },
];

/** Get center positions of toolbox discs (in screen coords). */
function getToolboxPositions() {
  const cx = TOOLBOX_WIDTH / 2;
  // Label takes ~16px + margin
  let y = TOOLBOX_PADDING_TOP + 16 + 4 + TOOLBOX_GAP;
  const positions = [];
  for (const item of TOOLBOX_ITEMS) {
    positions.push({ ...item, cx, cy: y + TOOLBOX_DISC_RADIUS });
    y += TOOLBOX_DISC_RADIUS * 2 + TOOLBOX_GAP;
  }
  return positions;
}

export const toolboxPositions = getToolboxPositions();

/** Hit-test toolbox discs. Returns { type, side } or null. */
export function hitTestToolbox(screenX, screenY) {
  for (const item of toolboxPositions) {
    const dx = item.cx - screenX;
    const dy = item.cy - screenY;
    if (dx * dx + dy * dy <= TOOLBOX_DISC_RADIUS * TOOLBOX_DISC_RADIUS) {
      return { type: item.type, side: item.side };
    }
  }
  return null;
}

/** Draw the toolbox strip. */
export function drawToolbox(ctx, canvasHeight) {
  const dark = isDark();
  const t = dark ? THEME.dark : THEME.light;

  // Background
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, TOOLBOX_WIDTH, canvasHeight);

  // Right border
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(TOOLBOX_WIDTH, 0);
  ctx.lineTo(TOOLBOX_WIDTH, canvasHeight);
  ctx.stroke();

  // Label
  ctx.fillStyle = t.label;
  ctx.font = '12px ' + "'Cambria Math', Cambria, serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('TOOLBOX', TOOLBOX_WIDTH / 2, TOOLBOX_PADDING_TOP);

  // Discs
  for (const item of toolboxPositions) {
    const style = getDiscStyle(item.type, item.side, dark);
    drawDiscShape(ctx, item.cx, item.cy, TOOLBOX_DISC_RADIUS, style);
  }
}
