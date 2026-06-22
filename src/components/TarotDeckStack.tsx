import { CardBackSvg } from './tarot/tarot-card-svg';
import styles from './TarotDeckStack.module.css';

interface Props {
  remaining: number;
  shuffling?: boolean;
}

const LAYER_COUNT = 5;

export function TarotDeckStack({ remaining, shuffling = false }: Props) {
  return (
    <div
      class={`${styles.wrap} ${shuffling ? styles.shuffling : ''}`}
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
