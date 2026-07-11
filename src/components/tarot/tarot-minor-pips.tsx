import type { TarotCard } from '../../data/tarot-meta';
import { PIP_LAYOUTS } from './tarot-pip-layouts';
import { SuitIcon } from './tarot-suit-icons';

const COURT_LABEL: Record<NonNullable<TarotCard['courtRank']>, string> = {
  page: 'P',
  knight: 'N',
  queen: 'Q',
  king: 'K',
};

const ACCENT = 'var(--accent, var(--color-gold))';
const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif';

/** 数字札 1〜10: viewBox 絶対座標でピップ配置 */
export function MinorPipsAbsolute({ card }: { card: TarotCard }) {
  const suit = card.suit;
  if (!suit || card.number > 10) return null;

  const positions = PIP_LAYOUTS[card.number];
  if (!positions) return null;

  return (
    <g>
      {positions.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x} ${pos.y})`}>
          <SuitIcon suit={suit} variant="pip" scale={pos.scale} />
        </g>
      ))}
    </g>
  );
}

/** コート札 11〜14: すべて同じ安全領域に人物と紋章を収める。 */
export function MinorCourtGlyph({ card }: { card: TarotCard }) {
  const suit = card.suit;
  if (!suit) return null;

  const courtLabel = card.courtRank ? COURT_LABEL[card.courtRank] : '';

  return (
    <g>
      <ellipse cx="0" cy="-7" rx="23" ry="31" fill={ACCENT} fill-opacity="0.08" />
      <path d="M-22 23 Q0 12 22 23" fill="none" stroke={ACCENT} stroke-width={0.55} opacity="0.65" />
      <circle cy="-14" r="6" fill={ACCENT} fill-opacity="0.32" stroke={ACCENT} stroke-width={0.75} />
      <path d="M-10 18 Q-8 -5 0 -7 Q8 -5 10 18 Z" fill={ACCENT} fill-opacity="0.23" stroke={ACCENT} stroke-width={0.8} stroke-linejoin="round" />
      <path d="M-14 3 L-5 -2 M14 3 L5 -2" fill="none" stroke={ACCENT} stroke-width={0.8} stroke-linecap="round" />
      <g transform="translate(0 2)">
        <SuitIcon suit={suit} variant="pip" scale={0.7} />
      </g>
      <path d="M-6 -23 Q0 -29 6 -23" fill="none" stroke={ACCENT} stroke-width={0.65} />
      {courtLabel && (
        <text y="32" text-anchor="middle" font-family={SERIF} font-size="8" fill={ACCENT} font-weight="bold" letter-spacing="2">
          {courtLabel}
        </text>
      )}
    </g>
  );
}
