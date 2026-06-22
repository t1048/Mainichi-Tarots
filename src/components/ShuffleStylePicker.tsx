import {
  SHUFFLE_STYLE_OPTIONS,
  getShuffleStyleOption,
  type ShuffleStyle,
} from '../lib/tarot-shuffle';
import styles from './ShuffleStylePicker.module.css';

interface Props {
  value: ShuffleStyle;
  onChange: (style: ShuffleStyle) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ShuffleStylePicker({ value, onChange, disabled = false, compact = false }: Props) {
  const selected = getShuffleStyleOption(value);

  return (
    <div
      class={`${styles.group} ${compact ? styles.compact : ''}`}
      role="radiogroup"
      aria-label="シャッフルの種類"
    >
      <p class={styles.label}>シャッフルの種類</p>
      <div class={styles.options}>
        {SHUFFLE_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value === opt.id}
            class={`${styles.option} ${value === opt.id ? styles.optionActive : ''}`}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p class={styles.description}>{selected.shortDescription}</p>
    </div>
  );
}
