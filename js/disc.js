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
};

export const DISC_RADIUS = 30;
export const TOOLBOX_DISC_RADIUS = 25;

export function getDiscStyle(type, side) {
  return DISC_STYLES[type][side];
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
