import type { ComponentChildren } from 'preact';
import type { ShuffleStyle } from '../lib/tarot-shuffle';
import { ShuffleStylePicker } from './ShuffleStylePicker';
import { TarotDeckStack } from './TarotDeckStack';
import styles from './TarotShuffleStage.module.css';

interface Props {
  remaining: number;
  shuffling: boolean;
  style: ShuffleStyle;
  onStyleChange: (style: ShuffleStyle) => void;
  controlsDisabled?: boolean;
  hint?: string;
  compact?: boolean;
  showDeck?: boolean;
  controlsPosition?: 'above' | 'below';
  children?: ComponentChildren;
}

export function TarotShuffleStage({
  remaining,
  shuffling,
  style,
  onStyleChange,
  controlsDisabled = false,
  hint,
  compact = false,
  showDeck = true,
  controlsPosition = 'above',
  children,
}: Props) {
  const controls = children && <div class={styles.controls}>{children}</div>;

  return (
    <div class={`${styles.stage} ${compact ? styles.compact : ''}`}>
      <ShuffleStylePicker
        value={style}
        onChange={onStyleChange}
        disabled={controlsDisabled}
        compact={compact}
      />
      {controlsPosition === 'above' && controls}
      {showDeck && (
        <TarotDeckStack remaining={remaining} shuffling={shuffling} variant={style} />
      )}
      {controlsPosition === 'below' && controls}
      {hint && <p class={styles.hint}>{hint}</p>}
    </div>
  );
}
