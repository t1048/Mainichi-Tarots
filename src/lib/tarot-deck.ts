import { ALL_CARDS, findCard, type TarotCard } from '../data/tarot-meta';
import { shuffle } from './rng';
import { shuffleDeckOrder, type ShuffleStyle } from './tarot-shuffle';
import { loadJSON, saveJSON } from './storage';

const STORAGE_KEY = 'tarot-deck';

export interface TarotDeckState {
  /** 山札の上から順に並んだカード ID */
  order: string[];
}

function allCardIds(): string[] {
  return ALL_CARDS.map((c) => c.id);
}

function isValidDeckOrder(order: unknown): order is string[] {
  if (!Array.isArray(order) || order.length === 0) return false;
  const validIds = new Set(ALL_CARDS.map((c) => c.id));
  const seen = new Set<string>();
  for (const id of order) {
    if (typeof id !== 'string' || !validIds.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

function createFreshDeck(): TarotDeckState {
  return { order: shuffle(allCardIds()) };
}

/** 欠けているカードを補い、無効 ID を除いた 78 枚の山札に整える */
function normalizeDeck(state: TarotDeckState): TarotDeckState {
  const validIds = new Set(allCardIds());
  const seen = new Set<string>();
  const order: string[] = [];

  for (const id of state.order) {
    if (validIds.has(id) && !seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }

  const missing = allCardIds().filter((id) => !seen.has(id));
  if (missing.length > 0) {
    order.push(...shuffle(missing));
  }

  return { order };
}

function deckNeedsNormalization(stored: TarotDeckState, normalized: TarotDeckState): boolean {
  if (stored.order.length !== normalized.order.length) return true;
  for (let i = 0; i < stored.order.length; i++) {
    if (stored.order[i] !== normalized.order[i]) return true;
  }
  return false;
}

export function loadTarotDeck(): TarotDeckState {
  const stored = loadJSON<TarotDeckState | null>(STORAGE_KEY, null);
  if (stored && isValidDeckOrder(stored.order)) {
    const normalized = normalizeDeck(stored);
    if (deckNeedsNormalization(stored, normalized)) {
      saveTarotDeck(normalized);
    }
    return normalized;
  }
  const fresh = createFreshDeck();
  saveTarotDeck(fresh);
  return fresh;
}

export function saveTarotDeck(state: TarotDeckState): void {
  saveJSON(STORAGE_KEY, state);
}

export function shuffleTarotDeck(style: ShuffleStyle = 'fan'): TarotDeckState {
  let state = loadTarotDeck();
  if (state.order.length === 0) {
    state = createFreshDeck();
  } else {
    state = { order: shuffleDeckOrder(state.order, style) };
  }
  saveTarotDeck(state);
  return state;
}

export function drawFromTarotDeck(count: number): { cards: TarotCard[]; deck: TarotDeckState } {
  if (count <= 0) {
    return { cards: [], deck: loadTarotDeck() };
  }

  const state = loadTarotDeck();
  const ids = state.order.slice(0, count);
  // 引いたカードは山札の下に戻し、枚数を減らさない
  const next: TarotDeckState = { order: [...state.order.slice(count), ...ids] };
  saveTarotDeck(next);

  const cards: TarotCard[] = [];
  for (const id of ids) {
    const card = findCard(id);
    if (card) cards.push(card);
  }

  return { cards, deck: next };
}

export function tarotDeckRemaining(): number {
  return loadTarotDeck().order.length;
}
