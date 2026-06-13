import { ALL_CARDS, type Orientation, type TarotCard } from '../data/tarot-meta';
import { chance, secureRandomInt, shuffle } from './rng';

export function drawTarotCard(): TarotCard {
  return ALL_CARDS[secureRandomInt(ALL_CARDS.length)];
}

export function drawTarotOrientation(): Orientation {
  return chance(0.5) ? 'upright' : 'reversed';
}

export function drawUniqueTarotCards(count: number): TarotCard[] {
  if (count <= 0) return [];
  return shuffle(ALL_CARDS).slice(0, count);
}
