import majorData from './tarot-major.json';
import minorData from './tarot-minor.json';

export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type Arcana = 'major' | 'minor';
export type CourtRank = 'page' | 'knight' | 'queen' | 'king';
export type Orientation = 'upright' | 'reversed';
export type Position = 'past' | 'present' | 'future' | 'today';

export const POSITION_LABELS: Record<Position, string> = {
  past: '過去',
  present: '現在',
  future: '未来',
  today: '今日',
};

export interface CardMeaning {
  keywords: string[];
  summary: string;
}

export interface TarotCard {
  id: string;
  arcana: Arcana;
  number: number;
  suit?: Suit;
  courtRank?: CourtRank;
  nameJp: string;
  nameEn?: string;
  upright: CardMeaning;
  reversed: CardMeaning;
}

interface MajorRaw {
  id: string;
  number: number;
  nameJp: string;
  nameEn: string;
  upright: CardMeaning;
  reversed: CardMeaning;
}

interface MinorRaw {
  id: string;
  number: number;
  nameJp: string;
  courtRank: CourtRank | null;
  upright: CardMeaning;
  reversed: CardMeaning;
}

const SUIT_MAP: Record<string, Suit> = {
  'wands-1': 'wands',
  'cups-1': 'cups',
  'swords-1': 'swords',
  'pentacles-1': 'pentacles',
};

const majors: TarotCard[] = (majorData as MajorRaw[]).map((c) => ({
  id: c.id,
  arcana: 'major',
  number: c.number,
  nameJp: c.nameJp,
  nameEn: c.nameEn,
  upright: c.upright,
  reversed: c.reversed,
}));

const minors: TarotCard[] = (minorData as MinorRaw[]).map((c) => {
  const suit = SUIT_MAP[c.id.replace(/-\d+$/, '-1')] ?? extractSuit(c.id);
  return {
    id: c.id,
    arcana: 'minor',
    number: c.number,
    suit,
    courtRank: c.courtRank ?? undefined,
    nameJp: c.nameJp,
    upright: c.upright,
    reversed: c.reversed,
  };
});

function extractSuit(id: string): Suit {
  if (id.startsWith('wands')) return 'wands';
  if (id.startsWith('cups')) return 'cups';
  if (id.startsWith('swords')) return 'swords';
  if (id.startsWith('pentacles')) return 'pentacles';
  throw new Error(`Unknown suit in id: ${id}`);
}

export const ALL_CARDS: readonly TarotCard[] = [...majors, ...minors];

export function findCard(id: string): TarotCard | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export function orientationLabel(orientation: Orientation): string {
  return orientation === 'upright' ? '正位置' : '逆位置';
}

export const SUIT_LABELS: Record<Suit, { name: string; color: string; icon: string }> = {
  wands: { name: 'ワンド', color: 'var(--suit-wands)', icon: '✦' },
  cups: { name: 'カップ', color: 'var(--suit-cups)', icon: '♥' },
  swords: { name: 'ソード', color: 'var(--suit-swords)', icon: '⚔' },
  pentacles: { name: 'ペンタクル', color: 'var(--suit-pentacles)', icon: '✿' },
};

export const SUIT_ORDER: Suit[] = ['wands', 'cups', 'swords', 'pentacles'];
