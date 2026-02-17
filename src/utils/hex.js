import { HEX_SIZE, HEX_W, HEX_H, COLS, ROWS } from '../constants.js';

/**
 * Corners of a pointy-top hex (6 points).
 */
export function hexCorners(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }
  return pts;
}

/**
 * Offset (col, row) to pixel (x, y) relative to map center.
 */
export function hexToPixel(col, row, totalW, totalH) {
  const x = HEX_W * col + (row % 2) * (HEX_W / 2) - totalW / 2;
  const y = HEX_H * 0.75 * row - totalH / 2;
  return { x, y };
}

/**
 * Offset coords to axial (q, r) for distance.
 */
export function offsetToAxial(col, row) {
  const q = col - (row - (row & 1)) / 2;
  const r = row;
  return { q, r };
}

/**
 * Axial (hex) distance between two hexes.
 */
export function axialDistance(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Shade a hex color by a factor.
 */
export function shadeColor(hex, factor) {
  const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.floor(((hex >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((hex & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

export function getMapDimensions() {
  const totalW = COLS * HEX_W;
  const totalH = ROWS * HEX_H * 0.75;
  return { totalW, totalH };
}
