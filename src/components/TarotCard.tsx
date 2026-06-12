import type { TarotCard, Orientation, Suit } from '../data/tarot-meta';
import { SUIT_LABELS } from '../data/tarot-meta';
import { romanize } from '../lib/format';
import styles from './TarotCard.module.css';

interface Props {
  card: TarotCard;
  orientation: Orientation;
  size?: 'sm' | 'md' | 'lg';
  revealed?: boolean;
}

const SIZE: Record<NonNullable<Props['size']>, { w: number; h: number }> = {
  sm: { w: 110, h: 175 },
  md: { w: 180, h: 290 },
  lg: { w: 240, h: 380 },
};

const SUIT_ACCENT: Record<Suit, string> = {
  wands: 'var(--suit-wands)',
  cups: 'var(--suit-cups)',
  swords: 'var(--suit-swords)',
  pentacles: 'var(--suit-pentacles)',
};

const COURT_LABEL: Record<NonNullable<TarotCard['courtRank']>, string> = {
  page: 'P',
  knight: 'N',
  queen: 'Q',
  king: 'K',
};

export function TarotCard({ card, orientation, size = 'md', revealed = true }: Props) {
  const { w, h } = SIZE[size];
  const accent = card.suit ? SUIT_ACCENT[card.suit] : 'var(--color-gold)';
  const flipped = orientation === 'reversed';

  return (
    <div
      class={`${styles.card} ${styles[size]} ${revealed ? styles.revealed : ''}`}
      style={{ width: `${w}px`, height: `${h}px` }}
    >
      <div class={`${styles.inner} ${flipped ? styles.flipped : ''}`}>
        <div class={styles.back} aria-hidden="true">
          <svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id={`bg-${card.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1a0f3a" />
                <stop offset="100%" stop-color="#06031a" />
              </linearGradient>
              <pattern id={`stars-${card.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.6" fill="#d4af37" opacity="0.6" />
                <circle cx="13" cy="9" r="0.4" fill="#d4af37" opacity="0.4" />
                <circle cx="8" cy="14" r="0.5" fill="#d4af37" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="160" fill={`url(#bg-${card.id})`} />
            <rect width="100" height="160" fill={`url(#stars-${card.id})`} />
            <g transform="translate(50 80)">
              <circle r="22" fill="none" stroke="#d4af37" stroke-width="0.8" />
              <circle r="16" fill="none" stroke="#d4af37" stroke-width="0.4" opacity="0.6" />
              <g stroke="#d4af37" stroke-width="0.8" stroke-linecap="round" fill="none">
                <path d="M0 -18 L3 -3 L18 0 L3 3 L0 18 L-3 3 L-18 0 L-3 -3 Z" fill="#d4af37" opacity="0.85" />
              </g>
              <text y="34" text-anchor="middle" font-size="6" fill="#d4af37" letter-spacing="2">TAROT</text>
            </g>
            <rect x="3" y="3" width="94" height="154" fill="none" stroke="#d4af37" stroke-width="0.5" rx="6" />
            <rect x="6" y="6" width="88" height="148" fill="none" stroke="#d4af37" stroke-width="0.3" rx="4" opacity="0.6" />
          </svg>
        </div>
        <div class={styles.front} style={{ ['--accent' as string]: accent }}>
          <svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id={`face-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                < stop offset="0%" stop-color="#f7eed3" />
                <stop offset="100%" stop-color="#e6d6a6" />
              </linearGradient>
            </defs>
            <rect width="100" height="160" fill={`url(#face-${card.id})`} />
            <rect x="3" y="3" width="94" height="154" fill="none" stroke={accent} stroke-width="0.6" rx="4" />
            <rect x="6" y="6" width="88" height="148" fill="none" stroke={accent} stroke-width="0.3" rx="2" opacity="0.7" />

            {/* Header: Roman number */}
            <text x="50" y="20" text-anchor="middle" font-family="serif" font-size="9" fill={accent} letter-spacing="2">
              {card.arcana === 'major' ? romanize(card.number) : card.number === 1 ? 'A' : String(card.number)}
              {card.courtRank ? COURT_LABEL[card.courtRank] : ''}
            </text>

            {/* Symbol area */}
            <g transform="translate(50 80)">
              <SuitSymbol card={card} />
            </g>

            {/* Name */}
            <g transform="translate(50 138)">
              <text text-anchor="middle" font-family="serif" font-size="7" fill="#3a2a14" letter-spacing="0.5">
                {card.nameJp}
              </text>
            </g>

            {/* Corner marks */}
            <text x="10" y="155" font-family="serif" font-size="5" fill={accent}>
              {card.arcana === 'major' ? 'M' : 'm'}
            </text>
            <text x="90" y="155" text-anchor="end" font-family="serif" font-size="5" fill={accent}>
              {card.arcana === 'major' ? 'M' : 'm'}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function SuitSymbol({ card }: { card: TarotCard }) {
  if (card.arcana === 'major') {
    return <MajorGlyph card={card} />;
  }
  return <MinorSuitGlyph card={card} />;
}

function MajorGlyph({ card }: { card: TarotCard }) {
  const n = card.number;
  // simple symbolic geometry per number
  const accent = 'var(--accent, var(--color-gold))';
  const stroke = { stroke: accent, strokeWidth: 0.9, fill: 'none' } as const;
  if (n === 0) {
    return (
      <g>
        <circle cx="0" cy="0" r="22" {...stroke} />
        <path d="M0 -10 L4 -2 L12 0 L4 2 L0 10 L-4 2 L-12 0 L-4 -2 Z" fill={accent} opacity="0.85" />
        <circle cx="0" cy="0" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 1) {
    return (
      <g>
        <circle cx="0" cy="-12" r="6" {...stroke} />
        <circle cx="0" cy="-12" r="3" fill={accent} />
        <path d="M0 -6 L-8 6 L0 4 L8 6 Z" {...stroke} fill={accent} fill-opacity="0.4" />
        <path d="M-12 14 L0 8 L12 14" {...stroke} />
      </g>
    );
  }
  if (n === 2) {
    return (
      <g>
        <path d="M-12 -8 Q0 -16 12 -8" {...stroke} />
        <path d="M-12 8 Q0 16 12 8" {...stroke} />
        <rect x="-4" y="-8" width="8" height="16" {...stroke} fill={accent} fill-opacity="0.4" />
        <circle cx="0" cy="0" r="1.5" fill={accent} />
      </g>
    );
  }
  if (n === 3) {
    return (
      <g>
        <path d="M0 -16 Q12 -8 12 4 Q12 16 0 16 Q-12 16 -12 4 Q-12 -8 0 -16 Z" {...stroke} fill={accent} fill-opacity="0.4" />
        <circle cx="0" cy="2" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 4) {
    return (
      <g>
        <rect x="-12" y="-14" width="24" height="28" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-6 -8 L6 -8 M-6 -2 L6 -2 M-6 4 L6 4 M-6 10 L6 10" {...stroke} />
        <circle cx="0" cy="-18" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 5) {
    return (
      <g>
        <path d="M0 -16 L0 16" {...stroke} />
        <path d="M-8 -8 L8 -8" {...stroke} />
        <path d="M-8 0 L8 0" {...stroke} />
        <path d="M-8 8 L8 8" {...stroke} />
        <circle cx="0" cy="-16" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 6) {
    return (
      <g>
        <circle cx="-8" cy="0" r="6" {...stroke} fill={accent} fill-opacity="0.3" />
        <circle cx="8" cy="0" r="6" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-2 0 L2 0 M0 -8 L0 8" {...stroke} />
        <circle cx="0" cy="-18" r="1.5" fill={accent} />
      </g>
    );
  }
  if (n === 7) {
    return (
      <g>
        <path d="M0 -16 L0 16" {...stroke} />
        <path d="M-8 -12 L8 4 M-8 -4 L8 12" {...stroke} />
        <circle cx="0" cy="-18" r="1.5" fill={accent} />
      </g>
    );
  }
  if (n === 8) {
    return (
      <g>
        <path d="M-12 4 L0 -12 L12 4 L0 20 Z" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-6 4 L0 -2 L6 4" {...stroke} />
        <path d="M-3 9 L0 6 L3 9" {...stroke} />
      </g>
    );
  }
  if (n === 9) {
    return (
      <g>
        <path d="M-8 -12 L8 -12 L0 0 Z" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-4 0 L4 0" {...stroke} />
        <circle cx="0" cy="6" r="4" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-6 14 L6 14" {...stroke} />
      </g>
    );
  }
  if (n === 10) {
    return (
      <g>
        <circle cx="0" cy="0" r="14" {...stroke} />
        <circle cx="0" cy="0" r="9" {...stroke} />
        <path d="M-14 0 L-18 0 M14 0 L18 0 M0 -14 L0 -18 M0 14 L0 18" {...stroke} />
        <circle cx="0" cy="0" r="1.5" fill={accent} />
      </g>
    );
  }
  if (n === 11) {
    return (
      <g>
        <path d="M-12 8 L-12 -8 L12 -8 L12 8" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-4 8 L-4 0 L4 0 L4 8" {...stroke} />
        <path d="M-4 14 L4 14" {...stroke} />
      </g>
    );
  }
  if (n === 12) {
    return (
      <g>
        <path d="M-8 -14 L8 14" {...stroke} />
        <circle cx="0" cy="0" r="4" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-4 -2 L-4 6" {...stroke} />
        <path d="M4 -2 L4 6" {...stroke} />
      </g>
    );
  }
  if (n === 13) {
    return (
      <g>
        <path d="M-12 -10 L0 -14 L12 -10 L12 6 L0 14 L-12 6 Z" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M0 -10 L0 4 M-6 -2 L6 -2" {...stroke} />
      </g>
    );
  }
  if (n === 14) {
    return (
      <g>
        <path d="M-12 -10 L12 -10 L8 6 L-8 6 Z" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-6 10 L6 10" {...stroke} />
        <path d="M-3 14 L3 14" {...stroke} />
      </g>
    );
  }
  if (n === 15) {
    return (
      <g>
        <path d="M-10 -10 L0 -16 L10 -10 L0 4 Z" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-12 8 L12 8" {...stroke} />
        <path d="M-4 12 L4 12" {...stroke} />
        <path d="M-2 16 L2 16" {...stroke} />
      </g>
    );
  }
  if (n === 16) {
    return (
      <g>
        <path d="M-14 16 L-4 -2 L-4 -16 M14 16 L4 -2 L4 -16" {...stroke} fill={accent} fill-opacity="0.3" />
        <circle cx="-4" cy="-16" r="2" fill={accent} />
        <circle cx="4" cy="-16" r="2" fill={accent} />
        <path d="M-12 16 L12 16" {...stroke} />
      </g>
    );
  }
  if (n === 17) {
    return (
      <g>
        <g fill={accent}>
          <path d="M0 -16 L1.5 -10 L0 -4 L-1.5 -10 Z" />
          <path d="M-4 -2 L-1 0 L-3 2 Z" />
          <path d="M4 -2 L1 0 L3 2 Z" />
          <path d="M-2 6 L0 4 L2 6 L0 8 Z" />
          <path d="M-2 12 L0 10 L2 12 L0 14 Z" />
        </g>
        <circle cx="0" cy="0" r="0.8" fill={accent} />
      </g>
    );
  }
  if (n === 18) {
    return (
      <g>
        <circle cx="-6" cy="-4" r="9" {...stroke} fill={accent} fill-opacity="0.4" />
        <circle cx="6" cy="4" r="6" {...stroke} fill={accent} fill-opacity="0.4" />
        <circle cx="0" cy="0" r="0.8" fill={accent} />
      </g>
    );
  }
  if (n === 19) {
    return (
      <g>
        <circle cx="0" cy="0" r="10" {...stroke} fill={accent} fill-opacity="0.85" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = Math.cos(a) * 12;
          const y1 = Math.sin(a) * 12;
          const x2 = Math.cos(a) * 18;
          const y2 = Math.sin(a) * 18;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} stroke-width={0.9} stroke-linecap="round" />;
        })}
      </g>
    );
  }
  if (n === 20) {
    return (
      <g>
        <path d="M-12 12 L0 -14 L12 12 Z" {...stroke} fill={accent} fill-opacity="0.3" />
        <path d="M-12 12 L12 12" {...stroke} />
        <circle cx="0" cy="2" r="2" fill={accent} />
      </g>
    );
  }
  // 21 World
  return (
    <g>
      <ellipse cx="0" cy="0" rx="14" ry="8" {...stroke} fill={accent} fill-opacity="0.3" />
      <ellipse cx="0" cy="0" rx="10" ry="5" {...stroke} />
      <circle cx="0" cy="0" r="1.5" fill={accent} />
    </g>
  );
}

function MinorSuitGlyph({ card }: { card: TarotCard }) {
  const suit = card.suit;
  if (!suit) return null;
  const accent = 'var(--accent, var(--color-gold))';
  const label = SUIT_LABELS[suit].name.charAt(0);
  const numberLabel = card.number === 1 ? 'A' : card.number <= 10 ? String(card.number) : '';
  return (
    <g>
      <SuitIcon suit={suit} />
      <text y="22" text-anchor="middle" font-family="serif" font-size="6" fill={accent} letter-spacing="0.6">
        {label}{numberLabel}
      </text>
    </g>
  );
}

function SuitIcon({ suit }: { suit: Suit }) {
  const stroke = { stroke: 'var(--accent, var(--color-gold))', fill: 'var(--accent, var(--color-gold))' } as const;
  if (suit === 'wands') {
    return (
      <g>
        <path d="M-2 -18 L2 -18 L2 12 L8 12 L0 22 L-8 12 L-2 12 Z" {...stroke} fill-opacity="0.9" />
      </g>
    );
  }
  if (suit === 'cups') {
    return (
      <g>
        <path d="M-10 -12 L10 -12 L8 4 Q0 12 -8 4 Z" {...stroke} fill-opacity="0.5" stroke-width={0.8} fill="var(--accent, var(--color-gold))" />
        <rect x="-3" y="6" width="6" height="6" {...stroke} fill-opacity="0.5" />
        <rect x="-8" y="12" width="16" height="3" {...stroke} fill-opacity="0.5" />
      </g>
    );
  }
  if (suit === 'swords') {
    return (
      <g>
        <path d="M-2 -18 L2 -18 L2 12 L8 12 L0 20 L-8 12 L-2 12 Z" {...stroke} fill-opacity="0.5" stroke-width={0.8} />
        <line x1="-10" y1="6" x2="10" y2="6" stroke="var(--accent, var(--color-gold))" stroke-width={0.8} />
        <circle cx="0" cy="6" r="1.5" fill="var(--accent, var(--color-gold))" />
      </g>
    );
  }
  // pentacles
  return (
    <g>
      <circle cx="0" cy="0" r="8" {...stroke} fill-opacity="0.4" stroke-width={0.8} />
      <circle cx="0" cy="0" r="3" {...stroke} fill-opacity="0.9" />
      <path d="M-8 0 L-12 0 M8 0 L12 0 M0 -8 L0 -12 M0 8 L0 12" stroke="var(--accent, var(--color-gold))" stroke-width={0.6} />
    </g>
  );
}
