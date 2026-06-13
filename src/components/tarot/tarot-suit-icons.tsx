import type { Suit } from '../../data/tarot-meta';

const ACCENT = 'var(--accent, var(--color-gold))';

export interface SuitIconProps {
  suit: Suit;
  variant?: 'full' | 'pip';
  scale?: number;
}

const PIP_SCALE = 0.42;
const FULL_SCALE = 1;

export function SuitIcon({ suit, variant = 'full', scale }: SuitIconProps) {
  const s = scale ?? (variant === 'pip' ? PIP_SCALE : FULL_SCALE);
  return (
    <g transform={`scale(${s})`}>
      {suit === 'wands' && <WandIcon />}
      {suit === 'cups' && <CupIcon />}
      {suit === 'swords' && <SwordIcon />}
      {suit === 'pentacles' && <PentacleIcon />}
    </g>
  );
}

function WandIcon() {
  return (
    <g fill={ACCENT} stroke={ACCENT} stroke-width={0.7} stroke-linecap="round" stroke-linejoin="round">
      <rect x="-1.5" y="-4" width="3" height="22" rx="1" fill-opacity="0.85" />
      <path d="M-6 -10 Q0 -18 6 -10 Q0 -6 -6 -10 Z" fill-opacity="0.9" />
      <path d="M-5 -8 Q0 -14 5 -8" fill="none" stroke-width={0.5} opacity="0.6" />
      <ellipse cx="0" cy="18" rx="4" ry="1.2" fill-opacity="0.5" />
    </g>
  );
}

function CupIcon() {
  return (
    <g fill={ACCENT} stroke={ACCENT} stroke-width={0.7} stroke-linecap="round" stroke-linejoin="round">
      <path d="M-9 -10 L9 -10 L7 2 Q0 10 -7 2 Z" fill-opacity="0.55" />
      <rect x="-2" y="2" width="4" height="7" fill-opacity="0.7" />
      <ellipse cx="0" cy="11" rx="7" ry="2" fill-opacity="0.6" />
      <path d="M-9 -10 Q0 -14 9 -10" fill="none" stroke-width={0.5} opacity="0.5" />
    </g>
  );
}

function SwordIcon() {
  return (
    <g fill={ACCENT} stroke={ACCENT} stroke-width={0.7} stroke-linecap="round" stroke-linejoin="round">
      <path d="M-1.5 -18 L1.5 -18 L1 4 L-1 4 Z" fill-opacity="0.85" />
      <path d="M-8 4 L8 4 L6 7 L-6 7 Z" fill-opacity="0.75" />
      <rect x="-1.5" y="7" width="3" height="8" rx="0.5" fill-opacity="0.65" />
      <circle cx="0" cy="17" r="2" fill-opacity="0.55" />
      <line x1="0" y1="-18" x2="0" y2="-14" stroke-width={1} />
    </g>
  );
}

function PentacleIcon() {
  const r = 9;
  const points = Array.from({ length: 5 }, (_, i) => {
    const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    return { ox: Math.cos(outer) * r, oy: Math.sin(outer) * r, ix: Math.cos(inner) * r * 0.42, iy: Math.sin(inner) * r * 0.42 };
  });
  const starPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.ox.toFixed(1)} ${p.oy.toFixed(1)} L${p.ix.toFixed(1)} ${p.iy.toFixed(1)}`)
    .join(' ')
    + ' Z';

  return (
    <g fill={ACCENT} stroke={ACCENT} stroke-width={0.7} stroke-linecap="round">
      <circle cx="0" cy="0" r={r} fill="none" stroke-width={0.8} />
      <path d={starPath} fill-opacity="0.65" stroke-width={0.6} />
      <circle cx="0" cy="0" r="1.5" fill-opacity="0.9" />
    </g>
  );
}
