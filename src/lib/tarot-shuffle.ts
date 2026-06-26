import { useCallback, useState } from 'preact/hooks';
import { secureRandomInt, shuffle } from './rng';
import { loadJSON, saveJSON } from './storage';

const STORAGE_KEY = 'shuffle-style';

export type ShuffleStyle = 'fan' | 'riffle' | 'overhand' | 'cascade' | 'cut' | 'swirl' | 'wash';

export type PageEffectMod = 'shake' | 'nudge' | 'bounce' | 'lift' | 'swirl' | null;

export interface ShuffleStyleOption {
  id: ShuffleStyle;
  label: string;
  shortDescription: string;
  durationMs: number;
  deckVariant: ShuffleStyle;
  pageEffect: PageEffectMod;
  featured: boolean;
}

export const SHUFFLE_STYLE_OPTIONS: readonly ShuffleStyleOption[] = [
  {
    id: 'fan',
    label: '扇形',
    shortDescription: '左右に扇を開くように広げて混ぜるシャッフル',
    durationMs: 550,
    deckVariant: 'fan',
    pageEffect: 'shake',
    featured: false,
  },
  {
    id: 'riffle',
    label: 'リフル',
    shortDescription: '左右に割って織り込むリフルシャッフル',
    durationMs: 650,
    deckVariant: 'riffle',
    pageEffect: 'nudge',
    featured: true,
  },
  {
    id: 'overhand',
    label: 'オーバーハンド',
    shortDescription: '上から小さな束をずらして混ぜるシャッフル',
    durationMs: 750,
    deckVariant: 'overhand',
    pageEffect: 'shake',
    featured: true,
  },
  {
    id: 'cascade',
    label: 'カスケード',
    shortDescription: 'カードが瀑布のように落ちて戻るシャッフル',
    durationMs: 600,
    deckVariant: 'cascade',
    pageEffect: 'bounce',
    featured: false,
  },
  {
    id: 'cut',
    label: 'カット',
    shortDescription: '山札を持ち上げて真ん中でカットするシャッフル',
    durationMs: 600,
    deckVariant: 'cut',
    pageEffect: 'lift',
    featured: false,
  },
  {
    id: 'swirl',
    label: 'スワール',
    shortDescription: 'くるりと回しながら混ぜるシャッフル',
    durationMs: 700,
    deckVariant: 'swirl',
    pageEffect: 'swirl',
    featured: false,
  },
  {
    id: 'wash',
    label: 'テーブル',
    shortDescription: 'テーブルに広げて手で混ぜるウォッシュシャッフル',
    durationMs: 30000,
    deckVariant: 'wash',
    pageEffect: null,
    featured: true,
  },
] as const;

const STYLE_IDS = SHUFFLE_STYLE_OPTIONS.map((o) => o.id);

function isShuffleStyle(value: unknown): value is ShuffleStyle {
  return typeof value === 'string' && (STYLE_IDS as string[]).includes(value);
}

export function getShuffleStyleOption(style: ShuffleStyle): ShuffleStyleOption {
  const found = SHUFFLE_STYLE_OPTIONS.find((o) => o.id === style);
  return found ?? SHUFFLE_STYLE_OPTIONS[0];
}

export function shuffleStyleDurationMs(style: ShuffleStyle): number {
  return getShuffleStyleOption(style).durationMs;
}

export function loadShuffleStyle(): ShuffleStyle {
  const stored = loadJSON<unknown>(STORAGE_KEY, 'fan');
  return isShuffleStyle(stored) ? stored : 'fan';
}

export function saveShuffleStyle(style: ShuffleStyle): void {
  saveJSON(STORAGE_KEY, style);
}

export function useShuffleStyle(): [ShuffleStyle, (style: ShuffleStyle) => void] {
  const [style, setStyleState] = useState<ShuffleStyle>(loadShuffleStyle);

  const setStyle = useCallback((next: ShuffleStyle) => {
    setStyleState(next);
    saveShuffleStyle(next);
  }, []);

  return [style, setStyle];
}

function riffleShuffle<T>(arr: readonly T[]): T[] {
  const n = arr.length;
  if (n <= 1) return arr.slice();
  const mid = Math.floor(n / 2) + secureRandomInt(Math.max(1, Math.floor(n * 0.1) + 1)) - Math.floor(n * 0.05);
  const left = arr.slice(0, Math.max(1, Math.min(n - 1, mid)));
  const right = arr.slice(left.length);
  const out: T[] = [];
  let li = 0;
  let ri = 0;
  let takeLeft = secureRandomInt(2) === 0;
  while (li < left.length || ri < right.length) {
    if (li >= left.length) {
      out.push(right[ri++]);
      continue;
    }
    if (ri >= right.length) {
      out.push(left[li++]);
      continue;
    }
    if (takeLeft) {
      out.push(left[li++]);
    } else {
      out.push(right[ri++]);
    }
    takeLeft = secureRandomInt(2) === 0;
  }
  return out;
}

function cutShuffle<T>(arr: readonly T[]): T[] {
  const n = arr.length;
  if (n <= 1) return arr.slice();
  const cutAt = 1 + secureRandomInt(n - 1);
  return [...arr.slice(cutAt), ...arr.slice(0, cutAt)];
}

function overhandShuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  const n = out.length;
  if (n <= 1) return out;
  const passes = 3 + secureRandomInt(4);
  for (let p = 0; p < passes; p++) {
    const chunk = 1 + secureRandomInt(Math.min(8, Math.max(1, Math.floor(n / 6))));
    const from = secureRandomInt(Math.max(1, n - chunk));
    const piece = out.splice(from, chunk);
    const to = secureRandomInt(out.length + 1);
    out.splice(to, 0, ...piece);
  }
  return out;
}

export function shuffleDeckOrder<T>(order: readonly T[], style: ShuffleStyle): T[] {
  switch (style) {
    case 'riffle':
      return riffleShuffle(order);
    case 'cut':
      return cutShuffle(order);
    case 'overhand':
      return overhandShuffle(order);
    case 'fan':
    case 'cascade':
    case 'swirl':
    case 'wash':
    default:
      return shuffle(order);
  }
}
