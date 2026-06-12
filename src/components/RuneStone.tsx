import type { Rune as RuneType } from '../data/rune-meta';
import styles from './RuneStone.module.css';

interface Props {
  rune: RuneType;
  size?: 'sm' | 'md' | 'lg';
  flipped?: boolean;
  glow?: boolean;
}

const SIZE: Record<NonNullable<Props['size']>, number> = {
  sm: 64,
  md: 96,
  lg: 128,
};

export function RuneStone({ rune, size = 'md', glow = false }: Props) {
  const px = SIZE[size];
  return (
    <div class={`${styles.stone} ${glow ? styles.glow : ''}`} style={{ width: `${px}px`, height: `${px}px` }}>
      <svg viewBox="-50 -50 100 100" class={styles.svg}>
        <defs>
          <radialGradient id={`stone-${rune.id}`} cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%" stop-color="#5a3f8a" />
            <stop offset="60%" stop-color="#2a1a55" />
            <stop offset="100%" stop-color="#0b0518" />
          </radialGradient>
          <linearGradient id={`rune-${rune.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffd86b" />
            <stop offset="100%" stop-color="#d4af37" />
          </linearGradient>
        </defs>
        <circle cx="0" cy="0" r="46" fill={`url(#stone-${rune.id})`} stroke="#d4af37" stroke-width="1.2" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#d4af37" stroke-width="0.4" opacity="0.4" />
        <g style={{ fill: `url(#rune-${rune.id})`, stroke: `url(#rune-${rune.id})` }}>
          {rune.id === 'wyrd' ? (
            <circle cx="0" cy="0" r="14" fill="none" stroke-width="3" />
          ) : (
            <text
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              font-size="48"
              style={{ fontFamily: 'serif', fontWeight: 700 }}
            >
              {rune.symbol}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
