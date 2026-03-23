/**
 * Workspace toolbar — floating bar at top-right, drawn on canvas (fixed screen space).
 * Two buttons: grid/snap toggle and delete.
 */

import { isDark } from './theme.js';
import { TOOLBOX_WIDTH } from './toolbox.js';

export const TOOLBAR_MARGIN = 12;
export const TOOLBAR_HEIGHT = 48;
const TOOLBAR_PADDING = 8;
const BTN_SIZE = 36;
const BTN_GAP = 6;
const BTN_RADIUS = 6;
const TOOLBAR_WIDTH = TOOLBAR_PADDING * 2 + BTN_SIZE * 2 + BTN_GAP;

const THEME = {
  light: {
    bg: '#FFFFFF', border: '#CBD5E1', shadow: 'rgba(0,0,0,0.06)',
    btnBg: '#FFFFFF', btnBorder: '#CBD5E1', btnIcon: '#94A3B8',
    gridOnBg: '#EEF2F7', gridOnBorder: '#3B82F6', gridOnIcon: '#3B82F6',
    delActiveBg: '#FEF2F2', delActiveBorder: '#EF4444', delActiveIcon: '#EF4444',
  },
  dark: {
    bg: '#1E293B', border: '#334155', shadow: 'rgba(0,0,0,0.3)',
    btnBg: '#0F172A', btnBorder: '#334155', btnIcon: '#64748B',
    gridOnBg: '#0F172A', gridOnBorder: '#60A5FA', gridOnIcon: '#60A5FA',
    delActiveBg: '#1C1917', delActiveBorder: '#EF4444', delActiveIcon: '#EF4444',
  },
};

/** Get toolbar position (top-right of workspace, respecting toolbox). */
function getToolbarRect(canvasWidth) {
  const x = canvasWidth - TOOLBAR_WIDTH - TOOLBAR_MARGIN;
  const y = TOOLBAR_MARGIN;
  return { x, y, w: TOOLBAR_WIDTH, h: TOOLBAR_HEIGHT };
}

/** Get button rects within the toolbar. */
function getButtonRects(canvasWidth) {
  const tb = getToolbarRect(canvasWidth);
  const btnY = tb.y + (tb.h - BTN_SIZE) / 2;
  return {
    grid: { x: tb.x + TOOLBAR_PADDING, y: btnY, w: BTN_SIZE, h: BTN_SIZE },
    del:  { x: tb.x + TOOLBAR_PADDING + BTN_SIZE + BTN_GAP, y: btnY, w: BTN_SIZE, h: BTN_SIZE },
  };
}

/** Hit-test toolbar buttons. Returns 'grid' | 'delete' | null. */
export function hitTestToolbar(screenX, screenY, canvasWidth) {
  const btns = getButtonRects(canvasWidth);
  if (pointInRect(screenX, screenY, btns.grid)) return 'grid';
  if (pointInRect(screenX, screenY, btns.del)) return 'delete';
  return null;
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** Draw the toolbar. */
export function drawToolbar(ctx, canvasWidth, state) {
  const dark = isDark();
  const t = dark ? THEME.dark : THEME.light;
  const tb = getToolbarRect(canvasWidth);
  const btns = getButtonRects(canvasWidth);
  const hasSelection = state.selection.size > 0;

  // Toolbar background
  ctx.fillStyle = t.bg;
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 1.5;
  roundRect(ctx, tb.x, tb.y, tb.w, tb.h, 8);
  ctx.fill();
  ctx.stroke();

  // Grid toggle button
  const gridOn = state.gridEnabled;
  drawButton(ctx, btns.grid,
    gridOn ? t.gridOnBg : t.btnBg,
    gridOn ? t.gridOnBorder : t.btnBorder,
    gridOn ? t.gridOnIcon : t.btnIcon,
    '\u25A6' // grid icon ▦
  );

  // Delete button
  drawButton(ctx, btns.del,
    hasSelection ? t.delActiveBg : t.btnBg,
    hasSelection ? t.delActiveBorder : t.btnBorder,
    hasSelection ? t.delActiveIcon : t.btnIcon,
    '\uD83D\uDDD1' // 🗑 trash icon
  );
}

function drawButton(ctx, rect, bg, border, iconColor, icon) {
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, BTN_RADIUS);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = iconColor;
  ctx.font = "16px 'Cambria Math', Cambria, serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Get canvas width for external callers. */
export function getToolbarCanvasWidth(canvasEl) {
  return canvasEl.width / devicePixelRatio;
}
