/**
 * Disc type constants and visual config.
 */

export const DiscType = {
  CONST: 'const',
  LINEAR: 'linear',
  QUAD: 'quad',
};

export const DiscSide = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
};

// Visual config per type+side, matching the design mockup exactly
export const DISC_STYLES = {
  light: {
    const: {
      positive: { fill: '#0F6B6E', ring: '#0A5255', text: '#FFFFFF', label: '+1' },
      negative: { fill: '#CCFBF1', ring: '#5EEAD4', text: '#134E4A', label: '\u22121' },
    },
    linear: {
      positive: { fill: '#9A3412', ring: '#7C2D12', text: '#FFFFFF', label: '+x' },
      negative: { fill: '#FFEDD5', ring: '#FDBA74', text: '#6B2E0F', label: '\u2212x' },
    },
    quad: {
      positive: { fill: '#5B21B6', ring: '#4C1D95', text: '#FFFFFF', label: '+x\u00B2' },
      negative: { fill: '#EDE9FE', ring: '#C4B5FD', text: '#3B1881', label: '\u2212x\u00B2' },
    },
  },
  dark: {
    const: {
      positive: { fill: '#14B8A6', ring: '#0D9488', text: '#FFFFFF', label: '+1' },
      negative: { fill: '#B2F0E6', ring: '#5EEAD4', text: '#134E4A', label: '\u22121' },
    },
    linear: {
      positive: { fill: '#EA580C', ring: '#C2410C', text: '#FFFFFF', label: '+x' },
      negative: { fill: '#FED7AA', ring: '#FDBA74', text: '#6B2E0F', label: '\u2212x' },
    },
    quad: {
      positive: { fill: '#8B5CF6', ring: '#7C3AED', text: '#FFFFFF', label: '+x\u00B2' },
      negative: { fill: '#DDD6FE', ring: '#C4B5FD', text: '#3B1881', label: '\u2212x\u00B2' },
    },
  },
};

export const DISC_RADIUS = 30;
export const TOOLBOX_DISC_RADIUS = 25;

export function getDiscStyle(type, side, dark = false) {
  const palette = dark ? DISC_STYLES.dark : DISC_STYLES.light;
  return palette[type][side];
}

export function createDisc(id, type, x, y, side = DiscSide.POSITIVE) {
  return { id, type, x, y, side };
}

export function flipDisc(disc) {
  return {
    ...disc,
    side: disc.side === DiscSide.POSITIVE ? DiscSide.NEGATIVE : DiscSide.POSITIVE,
  };
}

/** Draw a single disc circle with label. Shared by toolbox and workspace rendering. */
export function drawDiscShape(ctx, cx, cy, radius, style) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.ring;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const fontSize = Math.round(radius * 0.6);
  ctx.fillStyle = style.text;
  ctx.font = `bold ${fontSize}px 'Cambria Math', Cambria, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.label, cx, cy);
}
