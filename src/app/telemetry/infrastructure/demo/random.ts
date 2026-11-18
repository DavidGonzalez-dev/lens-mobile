/**
 * Creates a Mulberry32 PRNG function with a given numeric seed.
 * Returns a function that produces pseudo-random numbers in the range [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function(): number {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a pseudo-random integer in the inclusive range [min, max].
 */
export function between(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Returns a pseudo-random element from the given list.
 * Throws when the list is empty, since picking from an empty list is a caller error.
 */
export function pick<T>(rng: () => number, list: T[]): T {
  if (list.length === 0) {
    throw new Error('pick: cannot pick from an empty list');
  }
  return list[Math.floor(rng() * list.length)];
}

export function randomHex(rng: () => number, lenght: number): string {

  const hexDigits: string[] = '0123456789abcdef'.split('')
  const hex: string[] = []

  for (let i = 0; i < lenght; i++) {
    const digit = pick(rng, hexDigits)
    hex.push(digit)
  }

  return hex.join('')
}
