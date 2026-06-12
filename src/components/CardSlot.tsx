import type { TarotCard, Orientation } from '../data/tarot-meta';
import { TarotCard as TarotCardView } from './TarotCard';
import styles from './CardSlot.module.css';

interface Props {
  card: TarotCard;
  orientation: Orientation;
  revealed: boolean;
  delayMs?: number;
  position?: 'past' | 'present' | 'future';
  positionLabel?: string;
}

export function CardSlot({ card, orientation, revealed, delayMs = 0, positionLabel }: Props) {
  return (
    <div
      class={`${styles.slot} ${revealed ? styles.revealed : styles.covered}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {positionLabel && <span class={styles.position}>{positionLabel}</span>}
      <TarotCardView card={card} orientation={orientation} revealed={revealed} size="md" />
      {revealed && (
        <div class={styles.meta}>
          <strong>{card.nameJp}</strong>
          <span class={styles.orient}>
            {orientation === 'upright' ? '正位置' : '逆位置'}
          </span>
        </div>
      )}
    </div>
  );
}
