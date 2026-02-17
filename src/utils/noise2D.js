/**
 * Simple 2D gradient noise (Perlin-like) with configurable octaves.
 * @param {() => number} rng - Seeded random function
 * @param {number} [octaves=4] - Number of octaves
 * @returns {(x: number, y: number) => number} Noise function
 */
export function noise2D(rng, octaves = 4) {
  const grads = [];
  for (let i = 0; i < 256; i++) {
    const a = rng() * Math.PI * 2;
    grads.push([Math.cos(a), Math.sin(a)]);
  }
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const p = [...perm, ...perm];

  function dot(gx, gy, dx, dy) {
    return gx * dx + gy * dy;
  }
  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a, b, t) {
    return a + t * (b - a);
  }
  function base(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    return lerp(
      lerp(dot(...grads[aa], xf, yf), dot(...grads[ba], xf - 1, yf), u),
      lerp(dot(...grads[ab], xf, yf - 1), dot(...grads[bb], xf - 1, yf - 1), u),
      v
    );
  }
  return function (x, y) {
    let val = 0;
    let amp = 1;
    let freq = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      val += base(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max;
  };
}
