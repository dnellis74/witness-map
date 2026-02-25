/**
 * Biome definitions: 3×3 elevation × moisture matrix (9 terrain types).
 * (Settlement and Ruins are points of interest; see data/pois.js)
 *
 * Elevation/moisture in [-1, 1]. Tiers match 0–100% display (low &lt; 33%, mid 33–67%, high &gt; 67%).
 * Raw: low &lt; -0.34, mid -0.34–0.34, high &gt; 0.34.
 *
 *                    Low Moisture    Medium Moisture   High Moisture
 * High Elevation     Scrubland       Highland          Alpine Forest
 * Mid Elevation      Wasteland       Grassland         Forest
 * Low Elevation      Salt Flat      Wetlands          Deep Water
 */

export const BIOMES = {
  SCRUBLAND: { name: 'Scrubland', color: 0x7a6e5a, border: 0x9a8e7a, symbol: '○' },
  HIGHLAND: { name: 'Highland', color: 0x6a6258, border: 0x8a8278, symbol: '▲' },
  ALPINE_FOREST: { name: 'Alpine Forest', color: 0x2d4a48, border: 0x3d6a68, symbol: '♦' },
  WASTELAND: { name: 'Wasteland', color: 0xb8956a, border: 0xc8a87a, symbol: '×' },
  GRASSLAND: { name: 'Grassland', color: 0x6b7a5a, border: 0x8a9a7a, symbol: '·' },
  FOREST: { name: 'Forest', color: 0x3d5c4a, border: 0x5a7c6a, symbol: '♦' },
  SALT_FLAT: { name: 'Salt Flat', color: 0xc4beb2, border: 0xd8d2c8, symbol: '▢' },
  WETLANDS: { name: 'Wetlands', color: 0x5a6048, border: 0x7a8058, symbol: '∼' },
  DEEP_WATER: { name: 'Deep Water', color: 0x1a3d3a, border: 0x2a5d58, symbol: '≈' },
};

function elevationTier(elevation) {
  if (elevation < -0.34) return 'low';   // display < 33%
  if (elevation <= 0.34) return 'mid';    // 33–67%
  return 'high';                          // > 67%
}

function moistureTier(moisture) {
  if (moisture < -0.34) return 'low';
  if (moisture <= 0.34) return 'mid';
  return 'high';
}

export function getBiome(elevation, moisture) {
  const elev = elevationTier(elevation);
  const moist = moistureTier(moisture);
  if (elev === 'high' && moist === 'low') return 'SCRUBLAND';
  if (elev === 'high' && moist === 'mid') return 'HIGHLAND';
  if (elev === 'high' && moist === 'high') return 'ALPINE_FOREST';
  if (elev === 'mid' && moist === 'low') return 'WASTELAND';
  if (elev === 'mid' && moist === 'mid') return 'GRASSLAND';
  if (elev === 'mid' && moist === 'high') return 'FOREST';
  if (elev === 'low' && moist === 'low') return 'SALT_FLAT';
  if (elev === 'low' && moist === 'mid') return 'WETLANDS';
  if (elev === 'low' && moist === 'high') return 'DEEP_WATER';
  return 'GRASSLAND';
}

const DESCRIPTIONS = {
  SCRUBLAND: [
    'Arid slope; drought-adapted scrub, sparse canopy.',
    'Thin soil; rock outcrops, seasonal flash runoff.',
    'Low biomass; grazing pressure, fire-adapted seed bank.',
  ],
  HIGHLAND: [
    'Elevated plateau; cold drainage, wind exposure.',
    'Mixed grass and stone; short growing season.',
    'Upland pasture; limited timber, strategic sight lines.',
  ],
  ALPINE_FOREST: [
    'High moisture at elevation; conifer and hardy deciduous.',
    'Snowmelt-fed; dense understory, fungal networks intact.',
    'Canopy edge; bird migration corridor, cold-air pooling.',
  ],
  WASTELAND: [
    'Warm ochre substrate; low water retention, high albedo.',
    'Sparse colonization; dust storms, thermal variance.',
    'Saline patches; halophyte clusters, abandoned infrastructure.',
  ],
  GRASSLAND: [
    'Mid-elevation prairie; seasonal rains, fire cycle.',
    'Deep soil; grazing guilds, seed dispersal functional.',
    'Open canopy; raptor perch, ungulate migration route.',
  ],
  FOREST: [
    'Closed canopy; moisture retained, humus accumulation.',
    'Mixed deciduous; coppice recovery, edge habitat.',
    'Riparian adjacency; amphibian diversity, downed wood.',
  ],
  SALT_FLAT: [
    'Pale crust; evaporite deposits, hypersaline lens.',
    'Minimal vegetation; brine pools, wind-scoured surface.',
    'Pre-collapse extraction scars; substrate compaction.',
  ],
  WETLANDS: [
    'Murky olive-green; emergent reed, standing water.',
    'Anoxic substrate; methane flux, peat accumulation.',
    'Amphibian breeding; waterfowl stopover, silt deposition.',
  ],
  DEEP_WATER: [
    'Dark teal; pelagic zone, low light penetration.',
    'Thermal stratification; cold bottom layer, nutrient upwell.',
    'Submerged structure; salvage hazard, chemosynthetic margin.',
  ],
};

export function getTileDesc(biome) {
  const opts = DESCRIPTIONS[biome];
  return opts ? opts[Math.floor(Math.random() * opts.length)] : '';
}
