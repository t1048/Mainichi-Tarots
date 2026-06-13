import { throwCoins, type CoinThrow } from '../data/iching-meta';
import { secureRandomInt } from './rng';

export type CoinDisplay = 'h' | 't' | null;

export interface CoinTossCallbacks {
  onDisplay: (states: CoinDisplay[]) => void;
  onThrow: (throwResult: CoinThrow, log: CoinThrow[]) => void;
}

export interface CoinTossOptions {
  /** Minimum time (ms) to animate coins before settling. */
  minMs?: number;
  /** Extra random time (ms) added to `minMs`. */
  jitterMs?: number;
  /** Delay between each of the 6 throws. */
  betweenThrowsMs?: number;
}

/**
 * Runs the animated 6-coin-toss sequence used by 周易 pages.
 * Returns the full log of 6 throws so callers can build the hexagram.
 */
export async function runCoinTossAnimation(
  callbacks: CoinTossCallbacks,
  options: CoinTossOptions = {},
): Promise<CoinThrow[]> {
  const { minMs = 600, jitterMs = 300, betweenThrowsMs = 350 } = options;
  const log: CoinThrow[] = [];

  for (let i = 0; i < 6; i++) {
    const startTime = Date.now();
    const totalMs = minMs + secureRandomInt(jitterMs);

    await animateCoinDisplay(totalMs, startTime, callbacks.onDisplay);

    const t = throwCoins();
    log.push(t);
    callbacks.onThrow(t, log);

    if (i < 5) {
      await sleep(betweenThrowsMs);
    }
  }

  return log;
}

function animateCoinDisplay(
  totalMs: number,
  startTime: number,
  onDisplay: (states: CoinDisplay[]) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (Date.now() - startTime > totalMs) {
        resolve();
        return;
      }
      onDisplay([
        secureRandomInt(2) === 1 ? 'h' : 't',
        secureRandomInt(2) === 1 ? 'h' : 't',
        secureRandomInt(2) === 1 ? 'h' : 't',
      ]);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
