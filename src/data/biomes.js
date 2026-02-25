/**
 * Biome definitions and tile description data.
 * (Settlement and Ruins are points of interest; see data/pois.js)
 */

export const BIOMES = {
  FLAT_PLAINS: { name: 'Flat Plains', color: 0x9aab7a, border: 0xaabb8a, symbol: '·' },
  ROLLING_HILLS: { name: 'Rolling Hills', color: 0x6b8e4e, border: 0x8aaa6e, symbol: '∿' },
  STEEP_MOUNTAINS: { name: 'Steep Mountains', color: 0x5a5a6a, border: 0x7a7a8a, symbol: '▲' },
  LOWLANDS: { name: 'Lowlands', color: 0x4a7a5a, border: 0x6a9a7a, symbol: '∼' },
  VALLEYS: { name: 'Valleys', color: 0x3d7a4a, border: 0x5a9a6a, symbol: '⌒' },
  PLATEAUS: { name: 'Plateaus', color: 0x8a7a5a, border: 0xaa9a7a, symbol: '▬' },
  VOLCANIC: { name: 'Volcanic', color: 0x5a3028, border: 0x7a453a, symbol: '◇' },
};

export function getBiome(elevation, moisture, rng) {
  if (rng() < 0.015) return 'VOLCANIC';
  if (elevation < -0.2) return 'LOWLANDS';
  if (elevation < 0.05) return moisture > 0.2 ? 'VALLEYS' : 'LOWLANDS';
  if (elevation > 0.55) return 'STEEP_MOUNTAINS';
  if (elevation > 0.4) return 'PLATEAUS';
  if (elevation > 0.22) return 'ROLLING_HILLS';
  if (elevation > 0.08) return 'FLAT_PLAINS';
  return moisture > 0.3 ? 'VALLEYS' : 'LOWLANDS';
}

const DESCRIPTIONS = {
  FLAT_PLAINS: ['Open grassland; horizon unbroken. Wind patterns stable.', 'Former cropland; soil recovery ongoing. Nomadic herds observed.', 'Wide sight lines; minimal cover. Seasonal burns maintain diversity.'],
  ROLLING_HILLS: ['Gentle slopes; drainage networks intact. Mixed grass and scrub.', 'Crest and trough topography; microclimates varied.', 'Livestock corridors; soil stable on moderate grades.'],
  STEEP_MOUNTAINS: ['Exposed rock; snowline visible. Sparse vegetation at elevation.', 'Vertical relief; avalanche risk. Strategic overlooks.', 'Alpine conditions; seasonal access only.'],
  LOWLANDS: ['Low elevation; drainage slow. Wet-season pooling observed.', 'Floodplain adjacency; sediment-rich. Reed and sedge dominant.', 'Water table near surface; cultivation possible with drainage.'],
  VALLEYS: ['Sheltered topography; moisture retained. Riparian vegetation present.', 'Between higher ground; seasonal streams. Fertile substrate.', 'Corridor for movement; mixed woodland and meadow.'],
  PLATEAUS: ['Elevated flat terrain; tableland. Wind-scoured, dry summers.', 'Ancient uplift; erosion-resistant cap. Grazing and limited crops.', 'Wide views; defensible margins. Scattered outcrops.'],
  VOLCANIC: ['Thermal signature; lava flows or cinder. Sparse colonization.', 'Volcanic soil where weathered; fertility patchy. Fumarole activity.', 'Hazard zone; unstable substrate. Mineral deposits detected.'],
};

export function getTileDesc(biome) {
  const opts = DESCRIPTIONS[biome];
  return opts ? opts[Math.floor(Math.random() * opts.length)] : '';
}
