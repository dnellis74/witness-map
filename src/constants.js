/**
 * Map and hex grid constants (shared by scene and utils).
 */
export const MAP_SEED = 20240317;

/** Hex radius in pixels (pointy-top; flat-to-flat width = HEX_W). */
export const HEX_SIZE = 38;

/** Real-world scale: each hex represents this many km (e.g. for UI or game logic). */
export const HEX_KM = 10;

/** Map shape: hexagon radius (number of steps from center). Hex count = 3*R² + 3*R + 1. */
export const HEX_MAP_RADIUS = 63;

/** When true, all tiles are shown as explored (no fog of war). */
export const DEBUG_NO_FOG = false;

export const HEX_W = Math.sqrt(3) * HEX_SIZE;
export const HEX_H = 2 * HEX_SIZE;
