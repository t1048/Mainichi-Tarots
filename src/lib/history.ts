import type { TarotCard, Orientation, Position } from '../data/tarot-meta';
import type { Rune, RunePosition } from '../data/rune-meta';
import { loadJSON, saveJSON, removeKey } from './storage';

export type FortuneKind = 'tarot' | 'rune' | 'omikuji' | 'iching';

export type TarotMode = 'one' | 'three';

export interface TarotDrawn {
  card: TarotCard;
  orientation: Orientation;
  position: Position;
}

export interface RuneDrawn {
  rune: Rune;
  orientation: Orientation;
  position: RunePosition;
}

export interface BaseHistoryEntry {
  id: string;
  kind: FortuneKind;
  date: string;
  summary: string;
  detail: HistoryDetail;
}

export type HistoryDetail =
  | { kind: 'tarot'; mode: TarotMode; drawn: TarotDrawn[]; interpretation: string }
  | { kind: 'rune'; results: RuneDrawn[]; interpretation: string }
  | { kind: 'omikuji'; level: string; color: string; summary: string; categories: Array<{ label: string; text: string }> }
  | { kind: 'iching'; primaryNum: number; primaryName: string; changedNum: number | null; changedName: string | null; changedLine: number | null; judgment: string };

export type TarotHistoryDetail = Extract<HistoryDetail, { kind: 'tarot' }>;
export type RuneHistoryDetail = Extract<HistoryDetail, { kind: 'rune' }>;
export type OmikujiHistoryDetail = Extract<HistoryDetail, { kind: 'omikuji' }>;
export type IChingHistoryDetail = Extract<HistoryDetail, { kind: 'iching' }>;

const KEYS: Record<FortuneKind, string> = {
  tarot: 'tarot-history',
  rune: 'rune-history',
  omikuji: 'omikuji-history',
  iching: 'iching-history',
};

const RETENTION_DAYS = 14;

function isWithinRetention(iso: string, now: Date = new Date()): boolean {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

interface OldTarotEntry {
  id: string;
  date: string;
  mode: TarotMode;
  drawn: TarotDrawn[];
  interpretation: string;
}

function isOldTarotEntry(entry: unknown): entry is OldTarotEntry {
  return typeof entry === 'object' && entry !== null && !('kind' in entry);
}

function migrateTarotEntries(raw: unknown[]): BaseHistoryEntry[] {
  const entries: BaseHistoryEntry[] = [];
  for (const item of raw) {
    if (!isOldTarotEntry(item)) continue;
    entries.push({
      id: item.id,
      kind: 'tarot',
      date: item.date,
      summary: buildTarotSummary(item.drawn),
      detail: { kind: 'tarot', mode: item.mode, drawn: item.drawn, interpretation: item.interpretation },
    });
  }
  return entries;
}

export function newHistoryId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function buildTarotSummary(drawn: TarotDrawn[]): string {
  if (drawn.length === 0) return 'タロット';
  const first = drawn[0];
  const orient = first.orientation === 'upright' ? '正' : '逆';
  if (drawn.length === 1) return `${first.card.nameJp} (${orient})`;
  return `${first.card.nameJp} (${orient}) ほか ${drawn.length - 1} 枚`;
}

export function buildRuneSummary(results: RuneDrawn[]): string {
  if (results.length === 0) return 'ルーン';
  const first = results[0];
  const orient = first.orientation === 'upright' ? '正' : '逆';
  if (results.length === 1) return `${first.rune.nameJp} (${orient})`;
  return `${first.rune.nameJp} (${orient}) ほか ${results.length - 1} 個`;
}

export function buildOmikujiSummary(level: string): string {
  return level;
}

export function buildIChingSummary(primaryName: string, changedName: string | null): string {
  return changedName ? `${primaryName} → ${changedName}` : primaryName;
}

export function loadHistoryEntries(kind: FortuneKind): BaseHistoryEntry[] {
  const raw = loadJSON<unknown[]>(KEYS[kind], []);
  let entries: BaseHistoryEntry[];
  if (kind === 'tarot' && raw.length > 0 && isOldTarotEntry(raw[0])) {
    entries = migrateTarotEntries(raw);
  } else {
    entries = raw as BaseHistoryEntry[];
  }
  const retained = entries.filter((e) => isWithinRetention(e.date));
  if (retained.length !== entries.length) {
    saveHistoryEntries(kind, retained);
  }
  return retained;
}

export function saveHistoryEntries(kind: FortuneKind, entries: BaseHistoryEntry[]): void {
  saveJSON(KEYS[kind], entries);
}

export function saveHistoryEntry(entry: BaseHistoryEntry): void {
  const entries = loadHistoryEntries(entry.kind);
  const next = [entry, ...entries];
  saveHistoryEntries(entry.kind, next);
}

export function loadAllHistory(): BaseHistoryEntry[] {
  const all: BaseHistoryEntry[] = [];
  for (const kind of ['tarot', 'rune', 'omikuji', 'iching'] as FortuneKind[]) {
    all.push(...loadHistoryEntries(kind));
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function clearHistory(kind: FortuneKind | 'all'): void {
  if (kind === 'all') {
    for (const k of ['tarot', 'rune', 'omikuji', 'iching'] as FortuneKind[]) {
      removeKey(KEYS[k]);
    }
  } else {
    removeKey(KEYS[kind]);
  }
}
