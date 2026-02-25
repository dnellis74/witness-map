/**
 * Map generation: hexagon grid, biomes, POIs, and initial visibility.
 * Pure logic; no Phaser dependency.
 */
import { seededRandom } from '../utils/seededRandom.js';
import { noise2D } from '../utils/noise2D.js';
import { getBiome } from '../data/biomes.js';
import { POI_TYPES } from '../data/pois.js';
import {
  hexCorners,
  hexAxialToPixel,
  getHexagonTiles,
  axialDistance,
} from '../utils/hex.js';

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

/**
 * Fisher–Yates shuffle of array indices, using seeded rng.
 */
function shuffleIndices(length, rng) {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

/**
 * Generate the full map data.
 * @param {Object} options
 * @param {number} options.seed - World seed
 * @param {number} options.radius - Hexagon map radius
 * @param {number} options.hexSize - Hex pixel radius (for corners)
 * @param {number} options.poiCount - Number of points of interest
 * @param {boolean} options.noFog - If true, all tiles start explored
 * @returns {{ hexData: Array, settlements: Array, playerHome: { q, r }, originalSettlement: { q, r } }}
 */
export function generateMap(options) {
  const {
    seed,
    radius,
    hexSize,
    poiCount,
    noFog = false,
    elevScale = 1.5,
    moistScale = 1.5,
  } = options;

  const extent = 2 * radius;
  const elevNoise = noise2D(seededRandom(seed + 1), 5);
  const moistNoise = noise2D(seededRandom(seed + 3), 4);

  const hexData = [];
  const hexagonTiles = getHexagonTiles(radius);

  for (const { q, r } of hexagonTiles) {
    const { x, y } = hexAxialToPixel(q, r, hexSize);
    const nx = ((q + radius) / extent) * 3.5;
    const ny = ((r + radius) / extent) * 3.5;
    const elev = clamp(elevNoise(nx, ny) * elevScale, -1, 1);
    const moist = clamp(moistNoise(nx + 100, ny + 100) * moistScale, -1, 1);
    const tileRng = seededRandom(q * 31337 + r * 99991 + seed);
    const biomeKey = getBiome(elev, moist, () => tileRng());
    const corners = hexCorners(x, y, hexSize - 1);

    hexData.push({
      q,
      r,
      x,
      y,
      biomeKey,
      poiType: null,
      corners,
      elev,
      moist,
      axial: { q, r },
      visibility: 'unexplored',
    });
  }

  // Place POIs (seeded shuffle)
  const numPois = Math.max(1, Math.min(poiCount, hexData.length));
  const poiRng = seededRandom(seed + 100);
  const indices = shuffleIndices(hexData.length, poiRng);
  for (let i = 0; i < numPois; i++) {
    const tile = hexData[indices[i]];
    tile.poiType =
      i === 0 ? 'SETTLEMENT' : POI_TYPES[Math.floor(poiRng() * POI_TYPES.length)];
  }

  const settlements = hexData.filter((t) => t.poiType === 'SETTLEMENT');
  const center = { q: 0, r: 0 };
  let playerSettlement = settlements[0];
  if (settlements.length > 1) {
    let minDist = Infinity;
    for (const s of settlements) {
      const dist = axialDistance(center, s);
      if (dist < minDist) {
        minDist = dist;
        playerSettlement = s;
      }
    }
  }
  if (!playerSettlement) {
    playerSettlement =
      hexData.find((t) => t.q === 0 && t.r === 0) || hexData[0];
  }

  const playerHome = { q: playerSettlement.q, r: playerSettlement.r };
  const originalSettlement = { ...playerHome };

  // Initial visibility
  for (const tile of hexData) {
    if (noFog) {
      tile.visibility = 'explored';
    } else {
      const dist = axialDistance(playerHome, tile.axial);
      if (dist <= 1) tile.visibility = 'explored';
      else if (dist === 2) tile.visibility = 'visible';
    }
  }

  return {
    hexData,
    settlements,
    playerHome,
    originalSettlement,
  };
}
