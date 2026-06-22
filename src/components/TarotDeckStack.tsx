import { CardBackSvg } from './tarot/tarot-card-svg';
import type { ShuffleStyle } from '../lib/tarot-shuffle';
import styles from './TarotDeckStack.module.css';

interface Props {
  remaining: number;
  shuffling?: boolean;
  variant?: ShuffleStyle;
}

const LAYER_COUNT = 5;

const VARIANT_CLASS: Record<ShuffleStyle, string> = {
  fan: styles.variantFan,
  riffle: styles.variantRiffle,
  overhand: styles.variantOverhand,
  cascade: styles.variantCascade,
  cut: styles.variantCut,
  swirl: styles.variantSwirl,
};

export function TarotDeckStack({ remaining, shuffling = false, variant = 'fan' }: Props) {
  const variantClass = VARIANT_CLASS[variant];

  return (
    <div
      class={`${styles.wrap} ${shuffling ? styles.shuffling : ''} ${variantClass}`}
      aria-label={`山札 残り ${remaining} 枚`}
    >
      <div class={styles.stack} aria-hidden="true">
        {Array.from({ length: LAYER_COUNT }, (_, i) => (
          <div key={i} class={styles.layer} style={{ ['--layer' as string]: i }}>
            <CardBackSvg cardId={`deck-layer-${i}`} />
          </div>
        ))}
      </div>
      <p class={styles.caption}>
        山札 <strong>{remaining}</strong> 枚
      </p>
    </div>
  );
}
