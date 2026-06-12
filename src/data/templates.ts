import type { TarotCard, Orientation, Position } from './tarot-meta';
import { SUIT_LABELS } from './tarot-meta';

const POS_LABEL: Record<Position, string> = {
  past: 'あなたを形作ってきた背景',
  present: '今のあなた',
  future: 'これからの流れ',
  today: '今日のあなた',
};

const POS_VERB: Record<Position, string> = {
  past: '影響してきました',
  present: '表れています',
  future: '現れそうです',
  today: '表れています',
};

const POS_HINT: Record<Position, string> = {
  past: '過去に起きた出来事や、今のあなたの土台にあるもの',
  present: '今この瞬間にあなたが向き合っているテーマ',
  future: 'これからの流れに潜んでいる可能性',
  today: '今日一日を歩むうえで意識したいテーマ',
};

const POS_RELATION: Record<Position, string> = {
  past: 'このカードが強く関わってきました。',
  present: 'このカードが強く関わっています。',
  future: 'このカードが強く関わりそうです。',
  today: 'このカードが強く関わっています。',
};

export interface Interpretation {
  heading: string;
  body: string;
  keywords: string[];
  position: Position;
}

export function interpret(
  card: TarotCard,
  orientation: Orientation,
  position: Position = 'today',
): Interpretation {
  const tone = orientation === 'upright' ? card.upright : card.reversed;
  const posText = POS_LABEL[position];
  const verb = POS_VERB[position];
  const hint = POS_HINT[position];

  const relation = POS_RELATION[position];

  const body =
    `${posText}には「${tone.keywords[0] ?? ''}」のテーマが${verb}。\n` +
    `（${hint}。${relation}）\n\n` +
    `${tone.summary}`;

  return {
    heading: `${posText}へのメッセージ`,
    body,
    keywords: tone.keywords,
    position,
  };
}

export function suitLabel(card: TarotCard): string {
  return card.suit ? SUIT_LABELS[card.suit].name : '大アルカナ';
}

export function suitColor(card: TarotCard): string {
  return card.suit ? SUIT_LABELS[card.suit].color : 'var(--color-gold)';
}

export function describeOrientation(orientation: Orientation): string {
  return orientation === 'upright' ? '正位置' : '逆位置';
}
