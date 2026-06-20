/**
 * Tiny deterministic PRNG so mock fixtures are stable across server restarts.
 * Stable data makes spot-checks reproducible and avoids the member list
 * reshuffling on every request. Replaced entirely by real data in Stage 3.
 */

/** mulberry32 — a fast, seedable 32-bit PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random integer in the inclusive range [min, max]. */
export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick a random element from a non-empty array. */
export function pick<T>(rng: () => number, items: readonly T[]): T {
  // items is always called with a non-empty literal pool below.
  return items[Math.floor(rng() * items.length)]!;
}

/**
 * Pick a key from a weighted map, e.g. weightedPick(rng, { D: 48, R: 48, I: 4 }).
 * Weights need not sum to any particular total.
 */
export function weightedPick<K extends string>(
  rng: () => number,
  weights: Record<K, number>,
): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1]![0];
}
