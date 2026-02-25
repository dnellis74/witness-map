/**
 * Points of interest (POIs): settlements, ruins, etc.
 * Placed on top of biome tiles; each tile has at most one POI.
 */

export const POIS = {
  SETTLEMENT: {
    name: 'Settlement',
    color: 0xc8882a,
    border: 0xe8b84a,
    symbol: '◉',
  },
  RUINS: {
    name: 'Ruins',
    color: 0x4a3a6a,
    border: 0x6a5a9a,
    symbol: '▲',
  },
};

/** Ordered list of POI type keys for placement (first is guaranteed settlement for player home). */
export const POI_TYPES = ['SETTLEMENT', 'RUINS'];

const POI_DESCRIPTIONS = {
  SETTLEMENT: [
    'Active tribal settlement — population estimated 200-800',
    'Cultivated perimeter; smoke signals suggest ritual activity',
    'Resource extraction radius: limited — orbital threshold not exceeded',
  ],
  RUINS: [
    'Pre-collapse megastructure remnants — structural collapse risk',
    'Salvage activity detected; scavenger tribe territory',
    'Archaeological stratigraphy: several civilizational layers visible',
  ],
};

export function getPoiDescription(poiType) {
  const opts = POI_DESCRIPTIONS[poiType];
  return opts ? opts[Math.floor(Math.random() * opts.length)] : '';
}
