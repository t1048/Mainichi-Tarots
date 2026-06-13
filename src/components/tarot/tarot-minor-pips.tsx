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

/** コート札 11〜14: 中央に大アイコン + コート記号 */
export function MinorCourtGlyph({ card }: { card: TarotCard }) {
  const suit = card.suit;
  if (!suit) return null;

  const courtLabel = card.courtRank ? COURT_LABEL[card.courtRank] : '';

  return (
    <g>
      <rect x="-18" y="-28" width="36" height="56" fill="none" stroke={ACCENT} stroke-width={0.5} rx="3" opacity="0.5" />
      <SuitIcon suit={suit} variant="full" scale={0.85} />
      {courtLabel && (
        <text y="32" text-anchor="middle" font-family={SERIF} font-size="10" fill={ACCENT} font-weight="bold">
          {courtLabel}
        </text>
      )}
    </g>
  );
}
