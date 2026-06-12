import runesData from './runes.json';
import type { Orientation } from './tarot-meta';

export interface Rune {
  id: string;
  nameOrigin: string;
  symbol: string;
  nameJp: string;
  keywords: string[];
  upright: string;
  reversed: string;
}

export const RUNES: readonly Rune[] = runesData as Rune[];

export function findRune(id: string): Rune | undefined {
  return RUNES.find((r) => r.id === id);
}

export type RunePosition = 'situation' | 'obstacle' | 'advice';

export const RUNE_POSITION_LABEL: Record<RunePosition, string> = {
  situation: '状況',
  obstacle: '障害',
  advice: '助言',
};

export interface RuneResult {
  rune: Rune;
  orientation: Orientation;
  position: RunePosition;
}

export function interpretRune(result: RuneResult): string {
  const tone = result.orientation === 'upright' ? result.rune.upright : result.rune.reversed;
  const orient = result.orientation === 'upright' ? '正位置' : '逆位置';
  return `${result.rune.nameJp}(${result.rune.nameOrigin}) — ${orient}\n${tone}`;
}
