import type { Line } from '../data/iching-meta';
import type { RunePosition } from '../data/rune-meta';
import type { Orientation } from '../data/tarot-meta';
import { dateKey, loadJSON, saveJSON } from './storage';

export type DailyFortuneKind = 'tarot' | 'rune' | 'omikuji' | 'iching';

export interface DailyTarot {
  cardId: string;
  orientation: Orientation;
}

export interface DailyRune {
  results: Array<{
    runeId: string;
    orientation: Orientation;
    position: RunePosition;
  }>;
}

export interface DailyOmikuji {
  level: string;
  color: string;
  summary: string;
  categories: Array<{ id: string; label: string; text: string }>;
}

export interface DailyIChing {
  primaryThrows: Array<{ coins: [0 | 1, 0 | 1, 0 | 1]; sum: number; line: Line; changing: boolean }>;
  changedLine: number | null;
}

interface StoredEnvelope<T> {
  date: string;
  payload: T;
}

interface OldDailyTarot {
  date: string;
  cardId: string;
  orientation: Orientation;
}

const KEY_BY_KIND: Record<DailyFortuneKind, string> = {
  tarot: 'daily-tarot',
  rune: 'daily-rune',
  omikuji: 'daily-omikuji',
  iching: 'daily-iching',
};

function isEnvelope(value: unknown): value is StoredEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'date' in value &&
    'payload' in value
  );
}

function isOldDailyTarot(value: unknown): value is OldDailyTarot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'cardId' in value &&
    'orientation' in value
  );
}

export function loadTodayDaily<T>(kind: DailyFortuneKind): T | null {
  const stored = loadJSON<unknown>(KEY_BY_KIND[kind], null);
  if (!stored || typeof stored !== 'object') return null;
  const obj = stored as Record<string, unknown>;
  if (obj.date !== dateKey()) return null;

  if (kind === 'tarot' && isOldDailyTarot(obj)) {
    const payload = { cardId: obj.cardId, orientation: obj.orientation } as T;
    saveJSON<StoredEnvelope<T>>(KEY_BY_KIND[kind], { date: dateKey(), payload });
    return payload;
  }

  if (isEnvelope(obj)) {
    return obj.payload as T;
  }
  return null;
}

export function saveTodayDaily<T>(kind: DailyFortuneKind, payload: T): void {
  saveJSON<StoredEnvelope<T>>(KEY_BY_KIND[kind], { date: dateKey(), payload });
}
