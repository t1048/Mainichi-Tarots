import type { TarotCard, Orientation } from '../data/tarot-meta';
import { CardBackSvg, CardFrontSvg, suitAccentColor } from './tarot/tarot-card-svg';
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

export function TarotCard({ card, orientation, size = 'md', revealed = true }: Props) {
  const { w, h } = SIZE[size];
  const accent = suitAccentColor(card.suit);
  const flipped = orientation === 'reversed';

  return (
    <div
      class={`${styles.card} ${styles[size]} ${revealed ? styles.revealed : ''}`}
      style={{ width: `${w}px`, height: `${h}px` }}
    >
      <div class={styles.inner}>
        <div class={`${styles.orient} ${flipped ? styles.flipped : ''}`}>
          <div class={styles.back} aria-hidden="true">
            <CardBackSvg cardId={card.id} />
          </div>
          <div class={styles.front} style={{ ['--accent' as string]: accent }}>
            <CardFrontSvg card={card} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  );
}
