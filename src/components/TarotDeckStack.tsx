import { CardBackSvg } from './tarot/tarot-card-svg';
import type { ShuffleStyle } from '../lib/tarot-shuffle';
import styles from './TarotDeckStack.module.css';

interface Props {
  remaining: number;
  shuffling?: boolean;
  variant?: ShuffleStyle;
}

const STACK_LAYER_COUNT = 10;
const RIFFLE_PILE_COUNT = 5;

const VARIANT_CLASS: Record<Exclude<ShuffleStyle, 'wash'>, string> = {
  fan: styles.variantFan,
  riffle: styles.variantRiffle,
  overhand: styles.variantOverhand,
  cascade: styles.variantCascade,
  cut: styles.variantCut,
  swirl: styles.variantSwirl,
};

function DeckLayer({ index, idPrefix }: { index: number; idPrefix: string }) {
  return (
    <div class={styles.layer} style={{ ['--layer' as string]: index }}>
      <CardBackSvg cardId={`${idPrefix}-${index}`} />
    </div>
  );
}

export function TarotDeckStack({ remaining, shuffling = false, variant = 'fan' }: Props) {
  if (variant === 'wash') return null;

  const variantClass = VARIANT_CLASS[variant];

  return (
    <div
      class={`${styles.wrap} ${shuffling ? styles.shuffling : ''} ${variantClass}`}
      aria-label={`山札 残り ${remaining} 枚`}
    >
      {variant === 'riffle' ? (
        <div class={styles.riffleWrap} aria-hidden="true">
          <div class={styles.leftPile}>
            {Array.from({ length: RIFFLE_PILE_COUNT }, (_, i) => (
              <DeckLayer key={`l-${i}`} index={i} idPrefix="deck-left" />
            ))}
          </div>
          <div class={styles.rightPile}>
            {Array.from({ length: RIFFLE_PILE_COUNT }, (_, i) => (
              <DeckLayer key={`r-${i}`} index={i} idPrefix="deck-right" />
            ))}
          </div>
        </div>
      ) : (
        <div class={styles.stack} aria-hidden="true">
          {Array.from({ length: STACK_LAYER_COUNT }, (_, i) => (
            <DeckLayer key={i} index={i} idPrefix="deck-layer" />
          ))}
        </div>
      )}
      <p class={styles.caption}>
        山札 <strong>{remaining}</strong> 枚
      </p>
    </div>
  );
}
