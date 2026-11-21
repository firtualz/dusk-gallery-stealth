// random.js — a tiny seeded random number generator (mulberry32).
// The game is deterministic for a given seed, so screenshots are repeatable.

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [min, max) from a seeded generator.
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min));
}
