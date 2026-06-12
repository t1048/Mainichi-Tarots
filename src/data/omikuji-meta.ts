import omikujiData from './omikuji.json';
import { pickWeighted, secureRandomInt } from '../lib/rng';

export interface FortuneLevel {
  level: string;
  weight: number;
  color: string;
  summary: string;
}

export interface FortuneCategory {
  id: string;
  label: string;
  entries: string[];
}

interface OmikujiData {
  fortunes: FortuneLevel[];
  categories: FortuneCategory[];
}

const data = omikujiData as OmikujiData;

export const FORTUNES: readonly FortuneLevel[] = data.fortunes;
export const CATEGORIES: readonly FortuneCategory[] = data.categories;

export interface OmikujiResult {
  level: FortuneLevel;
  categories: Array<{ category: FortuneCategory; text: string }>;
}

export function drawOmikuji(): OmikujiResult {
  const level = pickWeighted(
    FORTUNES.map((f) => ({ value: f, weight: f.weight })),
  );
  const categories = CATEGORIES.map((c) => ({
    category: c,
    text: c.entries[secureRandomInt(c.entries.length)],
  }));
  return { level, categories };
}
