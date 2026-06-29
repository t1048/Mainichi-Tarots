import omikujiData from './omikuji.json';
import { pickWeighted, secureRandomInt } from '../lib/rng';

export const OMIKUJI_TEXTS_PER_LEVEL = 3;

export interface FortuneLevel {
  level: string;
  weight: number;
  color: string;
  summary: string;
}

export interface FortuneCategory {
  id: string;
  label: string;
  byLevel: Record<string, string[]>;
}

interface OmikujiData {
  fortunes: FortuneLevel[];
  categories: FortuneCategory[];
}

const data = omikujiData as OmikujiData;

export const FORTUNES: readonly FortuneLevel[] = data.fortunes;

export const OMIKUJI_LEVELS = FORTUNES.map((f) => f.level) as readonly string[];

export const CATEGORIES: readonly FortuneCategory[] = data.categories;

export interface OmikujiResult {
  level: FortuneLevel;
  categories: Array<{ category: FortuneCategory; text: string }>;
}

function pickCategoryText(category: FortuneCategory, levelName: string): string {
  const pool = category.byLevel[levelName];
  if (!pool?.length) {
    throw new Error(`おみくじ: カテゴリ「${category.id}」にレベル「${levelName}」の文がありません`);
  }
  if (pool.length !== OMIKUJI_TEXTS_PER_LEVEL) {
    throw new Error(
      `おみくじ: カテゴリ「${category.id}」レベル「${levelName}」は ${OMIKUJI_TEXTS_PER_LEVEL} 文必要（現在 ${pool.length} 文）`,
    );
  }
  return pool[secureRandomInt(pool.length)];
}

export function drawOmikuji(): OmikujiResult {
  const level = pickWeighted(
    FORTUNES.map((f) => ({ value: f, weight: f.weight })),
  );
  const categories = CATEGORIES.map((c) => ({
    category: c,
    text: pickCategoryText(c, level.level),
  }));
  return { level, categories };
}
