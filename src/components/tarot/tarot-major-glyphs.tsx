import type { TarotCard } from '../../data/tarot-meta';

const accent = 'var(--accent, var(--color-gold))';

function strokeProps(width = 0.9) {
  return {
    stroke: accent,
    strokeWidth: width,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function MajorGlyph({ card }: { card: TarotCard }) {
  const n = card.number;
  const s = strokeProps();

  if (n === 0) {
    return (
      <g>
        <path d="M-18 10 L18 10" {...s} />
        <path d="M-14 10 Q-10 -6 0 -10 Q10 -6 14 10" {...s} fill={accent} fill-opacity="0.25" />
        <circle cx="-6" cy="-2" r="3" {...s} />
        <path d="M-6 1 L-6 6 M-8 4 L-4 4" {...s} stroke-width={0.6} />
        <path d="M4 -6 L6 -2 L10 -4 L8 0 L12 2 L8 4 L10 8 L6 6 L4 10" fill={accent} fill-opacity="0.7" stroke={accent} stroke-width={0.5} />
      </g>
    );
  }
  if (n === 1) {
    return (
      <g>
        <path d="M-6 4 Q0 -6 6 4" {...s} fill="none" stroke-width={1.2} />
        <circle cx="0" cy="-10" r="5" {...s} fill={accent} fill-opacity="0.35" />
        <rect x="-10" y="6" width="20" height="4" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-4 10 L-4 14 M0 10 L0 14 M4 10 L4 14" {...s} stroke-width={0.6} />
        <line x1="-6" y1="6" x2="6" y2="6" {...s} />
      </g>
    );
  }
  if (n === 2) {
    return (
      <g>
        <path d="M-14 -6 Q0 -18 14 -6" {...s} />
        <path d="M-14 6 Q0 18 14 6" {...s} />
        <rect x="-5" y="-8" width="10" height="16" rx="1" {...s} fill={accent} fill-opacity="0.35" />
        <circle cx="0" cy="0" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 3) {
    return (
      <g>
        <path d="M0 -16 Q14 -6 14 6 Q14 16 0 16 Q-14 16 -14 6 Q-14 -6 0 -16 Z" {...s} fill={accent} fill-opacity="0.35" />
        <circle cx="0" cy="4" r="2.5" fill={accent} />
        <path d="M0 -10 L0 -4" {...s} stroke-width={0.6} />
      </g>
    );
  }
  if (n === 4) {
    return (
      <g>
        <rect x="-13" y="-14" width="26" height="28" rx="1" {...s} fill={accent} fill-opacity="0.25" />
        <path d="M-7 -8 L7 -8 M-7 -1 L7 -1 M-7 6 L7 6 M-7 13 L7 13" {...s} stroke-width={0.7} />
        <circle cx="0" cy="-18" r="2.5" fill={accent} />
      </g>
    );
  }
  if (n === 5) {
    return (
      <g>
        <path d="M0 -16 L0 16" {...s} />
        <path d="M-9 -9 L9 -9 M-9 -1 L9 -1 M-9 7 L9 7" {...s} stroke-width={0.7} />
        <circle cx="0" cy="-16" r="2.5" fill={accent} />
        <path d="M-4 -16 L4 -16" {...s} stroke-width={0.6} />
      </g>
    );
  }
  if (n === 6) {
    return (
      <g>
        <circle cx="-9" cy="0" r="7" {...s} fill={accent} fill-opacity="0.3" />
        <circle cx="9" cy="0" r="7" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-2 0 L2 0 M0 -8 L0 8" {...s} />
        <circle cx="0" cy="-18" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 7) {
    return (
      <g>
        <path d="M0 -16 L0 16" {...s} />
        <path d="M-9 -12 L9 5 M-9 -3 L9 14" {...s} stroke-width={0.8} />
        <circle cx="0" cy="-18" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 8) {
    return (
      <g>
        <path d="M-13 5 L0 -14 L13 5 L0 22 Z" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-7 5 L0 -4 L7 5" {...s} />
        <path d="M-4 10 L0 7 L4 10" {...s} stroke-width={0.7} />
      </g>
    );
  }
  if (n === 9) {
    return (
      <g>
        <path d="M-9 -12 L9 -12 L0 0 Z" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-5 0 L5 0" {...s} />
        <circle cx="0" cy="8" r="5" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-7 16 L7 16" {...s} stroke-width={0.7} />
      </g>
    );
  }
  if (n === 10) {
    return (
      <g>
        <circle cx="0" cy="0" r="15" {...s} />
        <circle cx="0" cy="0" r="10" {...s} stroke-width={0.6} />
        <path d="M-15 0 L-19 0 M15 0 L19 0 M0 -15 L0 -19 M0 15 L0 19" {...s} stroke-width={0.7} />
        <circle cx="0" cy="0" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 11) {
    return (
      <g>
        <path d="M-13 9 L-13 -9 L13 -9 L13 9" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-5 9 L-5 0 L5 0 L5 9" {...s} />
        <path d="M-5 15 L5 15" {...s} stroke-width={0.7} />
      </g>
    );
  }
  if (n === 12) {
    return (
      <g>
        <path d="M-9 -15 L9 15" {...s} stroke-width={1} />
        <circle cx="0" cy="0" r="5" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-5 -2 L-5 8 M5 -2 L5 8" {...s} stroke-width={0.7} />
      </g>
    );
  }
  if (n === 13) {
    return (
      <g>
        <path d="M8 -14 Q14 -6 10 4 L0 14 L-10 4 Q-14 -6 -8 -14 Z" {...s} fill={accent} fill-opacity="0.2" />
        <circle cx="0" cy="-4" r="5" {...s} fill="none" />
        <path d="M0 -9 L0 2 M-3 -1 L3 -1 M-2 2 L2 2" {...s} stroke-width={0.7} />
        <path d="M12 6 Q18 0 14 -8" {...s} stroke-width={1.2} />
        <path d="M13 -6 L16 -10 L14 -12" {...s} fill={accent} fill-opacity="0.6" stroke={accent} stroke-width={0.5} />
      </g>
    );
  }
  if (n === 14) {
    return (
      <g>
        <path d="M-13 -10 L13 -10 L9 7 L-9 7 Z" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-7 11 L7 11 M-4 15 L4 15" {...s} stroke-width={0.7} />
        <circle cx="0" cy="-14" r="2" fill={accent} />
      </g>
    );
  }
  if (n === 15) {
    return (
      <g>
        <path d="M-11 -10 L0 -17 L11 -10 L0 5 Z" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-13 9 L13 9 M-5 13 L5 13 M-2 17 L2 17" {...s} stroke-width={0.7} />
      </g>
    );
  }
  if (n === 16) {
    return (
      <g>
        <path d="M-10 16 L-6 -4 L-6 -16 L-2 -16 L-2 -4 Z" {...s} fill={accent} fill-opacity="0.35" />
        <path d="M10 16 L6 -4 L6 -16 L2 -16 L2 -4 Z" {...s} fill={accent} fill-opacity="0.35" />
        <path d="M-3 -8 L3 -14 L0 -18 L-3 -14 Z" fill={accent} fill-opacity="0.85" stroke={accent} stroke-width={0.5} />
        <path d="M-12 16 L12 16" {...s} stroke-width={0.7} />
      </g>
    );
  }
  if (n === 17) {
    return (
      <g>
        <path d="M0 -16 L2.5 -9 L0 -2 L-2.5 -9 Z" fill={accent} fill-opacity="0.9" />
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i * 2 * Math.PI) / 7 - Math.PI / 2;
          const x = Math.cos(a) * 12;
          const y = Math.sin(a) * 12;
          return (
            <path
              key={i}
              d={`M${x.toFixed(1)} ${(y - 3).toFixed(1)} L${(x + 1).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 3).toFixed(1)} L${(x - 1).toFixed(1)} ${y.toFixed(1)} Z`}
              fill={accent}
              fill-opacity="0.65"
            />
          );
        })}
        <circle cx="0" cy="2" r="1.2" fill={accent} />
      </g>
    );
  }
  if (n === 18) {
    return (
      <g>
        <circle cx="-7" cy="-4" r="10" {...s} fill={accent} fill-opacity="0.35" />
        <circle cx="7" cy="5" r="7" {...s} fill={accent} fill-opacity="0.35" />
        <path d="M-2 -8 Q0 -12 2 -8" {...s} stroke-width={0.6} />
        <circle cx="0" cy="0" r="1" fill={accent} />
      </g>
    );
  }
  if (n === 19) {
    return (
      <g>
        <circle cx="0" cy="0" r="11" {...s} fill={accent} fill-opacity="0.8" />
        <circle cx="-3" cy="-2" r="1" fill="#3a2a14" opacity="0.5" />
        <circle cx="3" cy="-2" r="1" fill="#3a2a14" opacity="0.5" />
        <path d="M-4 3 Q0 6 4 3" fill="none" stroke="#3a2a14" stroke-width={0.6} opacity="0.5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = Math.cos(a) * 13;
          const y1 = Math.sin(a) * 13;
          const x2 = Math.cos(a) * 19;
          const y2 = Math.sin(a) * 19;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} stroke-width={0.8} stroke-linecap="round" />;
        })}
      </g>
    );
  }
  if (n === 20) {
    return (
      <g>
        <path d="M-13 13 L0 -15 L13 13 Z" {...s} fill={accent} fill-opacity="0.3" />
        <path d="M-13 13 L13 13" {...s} stroke-width={0.8} />
        <circle cx="0" cy="2" r="2.5" fill={accent} />
        <path d="M-5 13 L-5 17 M5 13 L5 17" {...s} stroke-width={0.6} />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx="0" cy="0" rx="15" ry="9" {...s} fill={accent} fill-opacity="0.3" />
      <ellipse cx="0" cy="0" rx="11" ry="6" {...s} stroke-width={0.6} />
      <circle cx="0" cy="0" r="2" fill={accent} />
      <path d="M-11 0 L11 0 M0 -9 L0 9" {...s} stroke-width={0.5} opacity="0.5" />
    </g>
  );
}
