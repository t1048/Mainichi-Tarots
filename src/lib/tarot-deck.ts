import { ALL_CARDS, findCard, type TarotCard } from '../data/tarot-meta';
import { shuffle } from './rng';
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

export function loadTarotDeck(): TarotDeckState {
  const stored = loadJSON<TarotDeckState | null>(STORAGE_KEY, null);
  if (stored && isValidDeckOrder(stored.order)) {
    return stored;
  }
  const fresh = createFreshDeck();
  saveTarotDeck(fresh);
  return fresh;
}

export function saveTarotDeck(state: TarotDeckState): void {
  saveJSON(STORAGE_KEY, state);
}

export function shuffleTarotDeck(): TarotDeckState {
  let state = loadTarotDeck();
  if (state.order.length === 0) {
    state = createFreshDeck();
  } else {
    state = { order: shuffle(state.order) };
  }
  saveTarotDeck(state);
  return state;
}

export function drawFromTarotDeck(count: number): { cards: TarotCard[]; deck: TarotDeckState } {
  if (count <= 0) {
    return { cards: [], deck: loadTarotDeck() };
  }

  let state = loadTarotDeck();
  if (state.order.length < count) {
    state = createFreshDeck();
  }

  const ids = state.order.slice(0, count);
  state = { order: state.order.slice(count) };
  saveTarotDeck(state);

  const cards: TarotCard[] = [];
  for (const id of ids) {
    const card = findCard(id);
    if (card) cards.push(card);
  }

  return { cards, deck: state };
}

export function tarotDeckRemaining(): number {
  return loadTarotDeck().order.length;
}
