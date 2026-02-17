/**
 * Seeded LCG PRNG for deterministic map generation.
 * @param {number} seed - Initial seed
 * @returns {() => number} Function that returns next value in [0, 1)
 */
export function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
