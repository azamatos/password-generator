const RANGE = 2 ** 32;

/**
 * A uniform random integer in [0, max) from the Web Crypto CSPRNG.
 * Values from the top, incomplete block of the 32-bit range are redrawn, so there is no modulo bias.
 */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > RANGE) {
    throw new RangeError(`randomInt: max must be an integer from 1 to 2^32, got ${max}`);
  }
  const limit = RANGE - (RANGE % max);
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
}

export function pick<T>(items: ArrayLike<T>): T {
  return items[randomInt(items.length)];
}

/** log2 of a positive BigInt, accurate to double precision. */
export function log2BigInt(n: bigint): number {
  if (n <= 0n) return 0;
  const bits = n.toString(2).length;
  if (bits <= 53) return Math.log2(Number(n));
  const shift = BigInt(bits - 53);
  return Number(shift) + Math.log2(Number(n >> shift));
}
