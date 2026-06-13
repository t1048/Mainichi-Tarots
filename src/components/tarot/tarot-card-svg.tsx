import type { TarotCard, Suit } from '../../data/tarot-meta';
import { romanize } from '../../lib/format';
import { MajorGlyph } from './tarot-major-glyphs';
import { MinorCourtGlyph, MinorPipsAbsolute } from './tarot-minor-pips';
import { SuitIcon } from './tarot-suit-icons';

const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif';

const COURT_LABEL: Record<NonNullable<TarotCard['courtRank']>, string> = {
  page: 'P',
  knight: 'N',
  queen: 'Q',
  king: 'K',
};

function cornerLabel(card: TarotCard): string {
  if (card.arcana === 'major') return romanize(card.number);
  if (card.number === 1) return 'A';
  if (card.number <= 10) return String(card.number);
  return card.courtRank ? COURT_LABEL[card.courtRank] : String(card.number);
}

function CornerIndex({ card, accent, inverted }: { card: TarotCard; accent: string; inverted?: boolean }) {
  const label = cornerLabel(card);
  const x = inverted ? 90 : 10;
  const y = inverted ? 150 : 18;
  const suit = card.suit;

  return (
    <g transform={inverted ? `rotate(180 ${x} ${y})` : undefined}>
      <text x={x} y={y} text-anchor={inverted ? 'end' : 'start'} font-family={SERIF} font-size="8" fill={accent} font-weight="bold">
        {label}
      </text>
      {suit && (
        <g transform={`translate(${inverted ? x - 4 : x + 4}, ${y + 6}) scale(0.22)`}>
          <SuitIcon suit={suit} variant="pip" />
        </g>
      )}
      {card.arcana === 'major' && (
        <text x={x} y={y + 8} text-anchor={inverted ? 'end' : 'start'} font-family={SERIF} font-size="5" fill={accent} opacity="0.7">
          M
        </text>
      )}
    </g>
  );
}

function CornerOrnaments({ accent }: { accent: string }) {
  const corners = [
    { x: 8, y: 8, sx: 1, sy: 1 },
    { x: 92, y: 8, sx: -1, sy: 1 },
    { x: 8, y: 152, sx: 1, sy: -1 },
    { x: 92, y: 152, sx: -1, sy: -1 },
  ];
  return (
    <g stroke={accent} stroke-width={0.5} fill="none" opacity="0.65">
      {corners.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.sx} ${c.sy})`}>
          <path d="M0 0 L0 6 L6 6" />
        </g>
      ))}
    </g>
  );
}

export function CardBackSvg({ cardId }: { cardId: string }) {
  return (
    <svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`bg-${cardId}`} cx="0.5" cy="0.4" r="0.75">
          <stop offset="0%" stop-color="#2a1a55" />
          <stop offset="55%" stop-color="#1a0f3a" />
          <stop offset="100%" stop-color="#06031a" />
        </radialGradient>
        <pattern id={`stars-${cardId}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="0.5" fill="#d4af37" opacity="0.55" />
          <circle cx="11" cy="7" r="0.35" fill="#e8c766" opacity="0.4" />
          <circle cx="6" cy="12" r="0.45" fill="#d4af37" opacity="0.5" />
          <circle cx="14" cy="2" r="0.25" fill="#d4af37" opacity="0.35" />
        </pattern>
        <radialGradient id={`glow-${cardId}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="#d4af37" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#d4af37" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="160" fill={`url(#bg-${cardId})`} />
      <rect width="100" height="160" fill={`url(#stars-${cardId})`} />
      <ellipse cx="50" cy="80" rx="38" ry="55" fill={`url(#glow-${cardId})`} />

      <g transform="translate(50 80)">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = Math.cos(a) * 20;
          const y1 = Math.sin(a) * 20;
          const x2 = Math.cos(a) * 28;
          const y2 = Math.sin(a) * 28;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4af37" stroke-width={0.5} opacity="0.5" />;
        })}
        <circle r="26" fill="none" stroke="#d4af37" stroke-width={0.6} opacity="0.7" />
        <circle r="20" fill="none" stroke="#d4af37" stroke-width={0.4} opacity="0.5" />
        <circle r="14" fill="none" stroke="#d4af37" stroke-width={0.3} opacity="0.4" />
        <g stroke="#d4af37" stroke-width={0.7} stroke-linecap="round" fill="#d4af37">
          <path d="M0 -16 L2.5 -4 L16 0 L2.5 4 L0 16 L-2.5 4 L-16 0 L-2.5 -4 Z" opacity="0.85" />
        </g>
        <text y="36" text-anchor="middle" font-family={SERIF} font-size="5.5" fill="#e8c766" letter-spacing="3">
          TAROT
        </text>
      </g>

      <rect x="3" y="3" width="94" height="154" fill="none" stroke="#d4af37" stroke-width={0.6} rx="6" />
      <rect x="6" y="6" width="88" height="148" fill="none" stroke="#d4af37" stroke-width={0.35} rx="4" opacity="0.55" />
      <CornerOrnaments accent="#d4af37" />
    </svg>
  );
}

function CardSymbol({ card }: { card: TarotCard }) {
  if (card.arcana === 'major') {
    return (
      <g transform="translate(50 80)">
        <MajorGlyph card={card} />
      </g>
    );
  }
  if (card.number >= 11) {
    return (
      <g transform="translate(50 80)">
        <MinorCourtGlyph card={card} />
      </g>
    );
  }
  return <MinorPipsAbsolute card={card} />;
}

export function CardFrontSvg({ card, accent }: { card: TarotCard; accent: string }) {
  const headerLabel =
    card.arcana === 'major'
      ? romanize(card.number)
      : card.number === 1
        ? 'A'
        : card.number <= 10
          ? String(card.number)
          : card.courtRank
            ? COURT_LABEL[card.courtRank]
            : String(card.number);

  return (
    <svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`face-${card.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#faf4e4" />
          <stop offset="45%" stop-color="#f0e4c8" />
          <stop offset="100%" stop-color="#dcc99a" />
        </linearGradient>
        <linearGradient id={`sheen-${card.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="100%" stop-color="#c4a86a" stop-opacity="0.08" />
        </linearGradient>
        <pattern id={`grain-${card.id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.3" fill="#8a7a5a" opacity="0.06" />
          <circle cx="3" cy="3" r="0.2" fill="#6a5a3a" opacity="0.04" />
        </pattern>
      </defs>

      <rect width="100" height="160" fill={`url(#face-${card.id})`} />
      <rect width="100" height="160" fill={`url(#sheen-${card.id})`} />
      <rect width="100" height="160" fill={`url(#grain-${card.id})`} />

      <rect x="3" y="3" width="94" height="154" fill="none" stroke={accent} stroke-width={0.7} rx="4" />
      <rect x="6" y="6" width="88" height="148" fill="none" stroke={accent} stroke-width={0.35} rx="2" opacity="0.65" />
      <rect x="9" y="28" width="82" height="96" fill="none" stroke={accent} stroke-width={0.25} rx="2" opacity="0.35" stroke-dasharray="2 2" />

      <CornerOrnaments accent={accent} />
      <CornerIndex card={card} accent={accent} />
      <CornerIndex card={card} accent={accent} inverted />

      <text x="50" y="22" text-anchor="middle" font-family={SERIF} font-size="9" fill={accent} letter-spacing="2" font-weight="bold">
        {headerLabel}
      </text>

      <CardSymbol card={card} />

      <g transform="translate(50 138)">
        <text text-anchor="middle" font-family={SERIF} font-size="6.5" fill="#3a2a14" letter-spacing="0.5">
          {card.nameJp}
        </text>
      </g>
    </svg>
  );
}

export function suitAccentColor(suit: Suit | undefined): string {
  if (!suit) return 'var(--color-gold)';
  const map: Record<Suit, string> = {
    wands: 'var(--suit-wands)',
    cups: 'var(--suit-cups)',
    swords: 'var(--suit-swords)',
    pentacles: 'var(--suit-pentacles)',
  };
  return map[suit];
}
