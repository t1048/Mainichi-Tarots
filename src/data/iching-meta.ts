import ichingData from './iching.json';
import { secureRandomInt } from '../lib/rng';

export type Line = 0 | 1; // 0 = yin (-- --), 1 = yang (—)
export type ChangingIndex = number; // 1..6

export interface Trigram {
  id: string;
  nameJp: string;
  nameEn: string;
  symbol: string;
  lines: [Line, Line, Line]; // bottom → top
  nature: string;
  attribute: string;
}

export interface Hexagram {
  num: number;
  nameJp: string;
  upper: string;
  lower: string;
  judgment: string;
  theme: string;
}

interface IChingData {
  trigrams: Trigram[];
  hexagrams: Hexagram[];
}

const data = ichingData as IChingData;

export const TRIGRAMS: readonly Trigram[] = data.trigrams;
export const HEXAGRAMS: readonly Hexagram[] = data.hexagrams;

export const TRIGRAM_MAP: Record<string, Trigram> = Object.fromEntries(
  TRIGRAMS.map((t) => [t.id, t]),
);

export interface CoinThrow {
  coins: [0 | 1, 0 | 1, 0 | 1];
  sum: number; // 6, 7, 8, 9
  line: Line;
  changing: boolean;
}

export const LINE_VALUE: Record<number, { line: Line; changing: boolean; label: string }> = {
  6: { line: 0, changing: true, label: '老陰' },
  7: { line: 1, changing: false, label: '少陽' },
  8: { line: 0, changing: false, label: '少陰' },
  9: { line: 1, changing: true, label: '老陽' },
};

export function throwCoins(): CoinThrow {
  const coins: [0 | 1, 0 | 1, 0 | 1] = [
    secureRandomInt(2) as 0 | 1,
    secureRandomInt(2) as 0 | 1,
    secureRandomInt(2) as 0 | 1,
  ];
  // 1 = head (背, value 3), 0 = tail (字, value 2)
  const sum: number =
    (coins[0] === 1 ? 3 : 2) + (coins[1] === 1 ? 3 : 2) + (coins[2] === 1 ? 3 : 2);
  const meta = LINE_VALUE[sum];
  return { coins, sum, line: meta.line, changing: meta.changing };
}

export function drawHexagram(): { primary: CoinThrow[]; changed: CoinThrow[]; changedLine: number | null } {
  const primary: CoinThrow[] = [];
  for (let i = 0; i < 6; i++) primary.push(throwCoins());
  const changed: CoinThrow[] = primary.map((t) => {
    if (!t.changing) return t;
    const flipped: Line = t.line === 1 ? 0 : 1;
    return { ...t, line: flipped };
  });
  const changedIndex = primary.findIndex((t) => t.changing);
  return {
    primary,
    changed,
    changedLine: changedIndex >= 0 ? changedIndex + 1 : null,
  };
}

export interface HexagramBuilt {
  hex: Hexagram;
  lines: [Line, Line, Line, Line, Line, Line]; // bottom → top
}

export function findHexagram(lines: [Line, Line, Line, Line, Line, Line]): Hexagram {
  const lowerId = TRIGRAMS.find(
    (t) =>
      t.lines[0] === lines[0] && t.lines[1] === lines[1] && t.lines[2] === lines[2],
  )?.id;
  const upperId = TRIGRAMS.find(
    (t) =>
      t.lines[0] === lines[3] && t.lines[1] === lines[4] && t.lines[2] === lines[5],
  )?.id;
  const found = HEXAGRAMS.find(
    (h) => h.upper === upperId && h.lower === lowerId,
  );
  if (found) return found;
  // Fallback: 未濟 (64)
  return HEXAGRAMS[HEXAGRAMS.length - 1];
}

export function buildHexagramFrom(throws: CoinThrow[]): HexagramBuilt {
  const lines = throws.map((t) => t.line) as [Line, Line, Line, Line, Line, Line];
  return { hex: findHexagram(lines), lines };
}

export interface IChingResult {
  primary: HexagramBuilt;
  changed: HexagramBuilt | null;
  changedLine: number | null;
  throws: CoinThrow[];
}
