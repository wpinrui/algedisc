/**
 * Toolbox strip — rendered on canvas, fixed screen position (not affected by pan).
 */

import { DiscType, DiscSide, getDiscStyle, TOOLBOX_DISC_RADIUS } from './disc.js';

export const TOOLBOX_WIDTH = 80;
const TOOLBOX_BG = '#EEF2F7';
const TOOLBOX_BORDER = '#CBD5E1';
const TOOLBOX_LABEL_COLOR = '#94A3B8';
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
  // Background
  ctx.fillStyle = TOOLBOX_BG;
  ctx.fillRect(0, 0, TOOLBOX_WIDTH, canvasHeight);

  // Right border
  ctx.strokeStyle = TOOLBOX_BORDER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(TOOLBOX_WIDTH, 0);
  ctx.lineTo(TOOLBOX_WIDTH, canvasHeight);
  ctx.stroke();

  // Label
  ctx.fillStyle = TOOLBOX_LABEL_COLOR;
  ctx.font = '12px ' + "'Cambria Math', Cambria, serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('TOOLBOX', TOOLBOX_WIDTH / 2, TOOLBOX_PADDING_TOP);

  // Discs
  for (const item of toolboxPositions) {
    const style = getDiscStyle(item.type, item.side);
    drawDiscShape(ctx, item.cx, item.cy, TOOLBOX_DISC_RADIUS, style);
  }
}

/** Draw a single disc circle with label. Shared by toolbox and workspace rendering. */
export function drawDiscShape(ctx, cx, cy, radius, style) {
  // Ring / border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.ring;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Label
  const fontSize = Math.round(radius * 0.6);
  ctx.fillStyle = style.text;
  ctx.font = `bold ${fontSize}px 'Cambria Math', Cambria, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.label, cx, cy);
}
