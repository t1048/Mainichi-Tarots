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
  children,
}: Props) {
  return (
    <div class={`${styles.stage} ${compact ? styles.compact : ''}`}>
      <ShuffleStylePicker
        value={style}
        onChange={onStyleChange}
        disabled={controlsDisabled}
        compact={compact}
      />
      {showDeck && (
        <TarotDeckStack remaining={remaining} shuffling={shuffling} variant={style} />
      )}
      {hint && <p class={styles.hint}>{hint}</p>}
      {children}
    </div>
  );
}
