/**
 * Biome definitions and tile description data.
 */

export const BIOMES = {
  DEEP_WATER: { name: 'Deep Water', color: 0x1e5c82, border: 0x2a7a9e, symbol: '≈' },
  WETLANDS: { name: 'Wetlands', color: 0x2a7a6e, border: 0x3a9a8e, symbol: '~' },
  FOREST: { name: 'Forest', color: 0x3d6e2a, border: 0x5a9a3a, symbol: '♦' },
  GRASSLAND: { name: 'Grassland', color: 0x7a8a3a, border: 0x9aaa4a, symbol: '·' },
  SCRUBLAND: { name: 'Scrubland', color: 0x8a6a2e, border: 0xaa8a4e, symbol: '○' },
  WASTELAND: { name: 'Wasteland', color: 0x6a3a28, border: 0x8a5a3a, symbol: '×' },
  RUINS: { name: 'Ruins', color: 0x4a3a6a, border: 0x6a5a9a, symbol: '▲' },
  HIGHLAND: { name: 'Highland', color: 0x5a5070, border: 0x7a6a90, symbol: '▲' },
  SETTLEMENT: { name: 'Settlement', color: 0xc8882a, border: 0xe8b84a, symbol: '◉' },
};

export function getBiome(elevation, moisture, ruinNoise, rng) {
  if (rng() < 0.0055) return 'SETTLEMENT';
  if (elevation < -0.35) return 'DEEP_WATER';
  if (elevation < -0.1) {
    return moisture > 0.1 ? 'WETLANDS' : 'DEEP_WATER';
  }
  if (ruinNoise > 0.3 && elevation > 0.1) return 'RUINS';
  if (elevation > 0.55) return 'HIGHLAND';
  if (moisture > 0.35) return elevation > 0.2 ? 'FOREST' : 'WETLANDS';
  if (moisture > 0.05) return elevation > 0.3 ? 'FOREST' : 'GRASSLAND';
  if (elevation > 0.3) return 'SCRUBLAND';
  return 'WASTELAND';
}

const DESCRIPTIONS = {
  DEEP_WATER: ['Murky pelagic waters; bioluminescent drift observed at depth', 'Saline basin — pre-collapse coastal infrastructure submerged', 'Thermal vents detected; novel chemosynthetic communities possible'],
  WETLANDS: ['Emergent reed beds; waterfowl colonies re-established', 'Brackish delta — silt accumulation accelerating', 'Amphibian biodiversity index: recovering'],
  FOREST: ['Old-growth canopy regenerating; fungal networks intact', 'Mixed deciduous regrowth over former agricultural land', 'Keystone predator reintroduction observed — population stabilizing'],
  GRASSLAND: ['Seasonal grasses; nomadic ungulate herds passing through', 'Wind-sculpted plains; seed dispersal corridors functional', 'Low-intensity human activity signatures detected'],
  SCRUBLAND: ['Drought-adapted shrub communities; soil carbon depleted', 'Transitional zone between ruin and regrowth', 'Sparse foraging bands; no permanent structures'],
  WASTELAND: ['Contaminated substrate — long-half-life isotopes present', 'Barren hardpan; extreme thermal variance', 'Human avoidance confirmed; no tribal signature'],
  RUINS: ['Pre-collapse megastructure remnants — structural collapse risk', 'Salvage activity detected; scavenger tribe territory', 'Archaeological stratigraphy: several civilizational layers visible'],
  HIGHLAND: ['Alpine meadow; low oxygen; seasonal snowpack', 'Isolated plateau community; distinct cultural drift observed', 'Strategic elevation — long-range observation point'],
  SETTLEMENT: ['Active tribal settlement — population estimated 200-800', 'Cultivated perimeter; smoke signals suggest ritual activity', 'Resource extraction radius: limited — orbital threshold not exceeded'],
};

export function getTileDesc(biome) {
  const opts = DESCRIPTIONS[biome];
  return opts[Math.floor(Math.random() * opts.length)];
}
