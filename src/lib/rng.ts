export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error('maxExclusive must be > 0');
  const cryptoObj =
    typeof globalThis !== 'undefined' && (globalThis as { crypto?: Crypto }).crypto
      ? (globalThis as { crypto: Crypto }).crypto
      : undefined;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const buf = new Uint32Array(1);
    let n = 0;
    do {
      cryptoObj.getRandomValues(buf);
      n = buf[0];
    } while (n >= limit);
    return n % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pickRandom: empty array');
  return arr[secureRandomInt(arr.length)];
}

export interface WeightedItem<T> {
  value: T;
  weight: number;
}

export function pickWeighted<T>(items: readonly WeightedItem<T>[]): T {
  if (items.length === 0) throw new Error('pickWeighted: empty list');
  let total = 0;
  for (const it of items) total += it.weight;
  if (total <= 0) throw new Error('pickWeighted: total weight must be > 0');
  let n = secureRandomInt(total);
  for (const it of items) {
    if (n < it.weight) return it.value;
    n -= it.weight;
  }
  return items[items.length - 1].value;
}

export function chance(probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return secureRandomInt(1_000_000) < Math.floor(probability * 1_000_000);
}
