import { HEX_SIZE, HEX_W, HEX_H, HEX_MAP_RADIUS } from '../constants.js';

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
 * Axial (q, r) to pixel (x, y) for pointy-top hexes, centered at (0, 0).
 */
export function hexAxialToPixel(q, r, size = HEX_SIZE) {
  const w = Math.sqrt(3) * size;
  const h = 2 * size;
  const x = w * (q + r / 2);
  const y = h * 0.75 * r;
  return { x, y };
}

/**
 * All axial (q, r) coordinates inside a hexagon of given radius (center at 0,0).
 */
export function getHexagonTiles(radius) {
  const tiles = [];
  for (let r = -radius; r <= radius; r++) {
    const qMin = Math.max(-radius, -radius - r);
    const qMax = Math.min(radius, radius - r);
    for (let q = qMin; q <= qMax; q++) {
      tiles.push({ q, r });
    }
  }
  return tiles;
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
  const R = HEX_MAP_RADIUS;
  const totalW = 2 * Math.sqrt(3) * HEX_SIZE * (R + 0.5);
  const totalH = 3 * HEX_SIZE * (R + 0.5);
  return { totalW, totalH };
}
