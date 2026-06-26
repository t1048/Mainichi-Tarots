import { useState } from 'preact/hooks';
import {
  SHUFFLE_STYLE_OPTIONS,
  getShuffleStyleOption,
  type ShuffleStyle,
  type ShuffleStyleOption,
} from '../lib/tarot-shuffle';
import styles from './ShuffleStylePicker.module.css';

interface Props {
  value: ShuffleStyle;
  onChange: (style: ShuffleStyle) => void;
  disabled?: boolean;
  compact?: boolean;
}

function StyleOptionButton({
  opt,
  value,
  disabled,
  onChange,
}: {
  opt: ShuffleStyleOption;
  value: ShuffleStyle;
  disabled: boolean;
  onChange: (style: ShuffleStyle) => void;
}) {
  return (
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
  );
}

export function ShuffleStylePicker({ value, onChange, disabled = false, compact = false }: Props) {
  const [showAll, setShowAll] = useState(false);
  const selected = getShuffleStyleOption(value);
  const featuredOptions = SHUFFLE_STYLE_OPTIONS.filter((o) => o.featured);
  const otherOptions = SHUFFLE_STYLE_OPTIONS.filter((o) => !o.featured);
  const hiddenSelected = !selected.featured && !showAll ? selected : null;

  return (
    <div
      class={`${styles.group} ${compact ? styles.compact : ''}`}
      role="radiogroup"
      aria-label="シャッフルの種類"
    >
      <div class={styles.header}>
        <p class={styles.label}>シャッフルの種類</p>
        <button
          type="button"
          class={`${styles.toggle} ${showAll ? styles.toggleOpen : ''}`}
          aria-expanded={showAll}
          aria-controls="shuffle-other-options"
          onClick={() => setShowAll((v) => !v)}
          disabled={disabled}
        >
          {showAll ? 'その他を隠す' : 'その他のシャッフルを表示'}
        </button>
      </div>
      <div class={styles.options}>
        {featuredOptions.map((opt) => (
          <StyleOptionButton
            key={opt.id}
            opt={opt}
            value={value}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
        {hiddenSelected && (
          <StyleOptionButton
            key={hiddenSelected.id}
            opt={hiddenSelected}
            value={value}
            disabled={disabled}
            onChange={onChange}
          />
        )}
      </div>
      {showAll && (
        <div
          id="shuffle-other-options"
          class={styles.others}
          role="group"
          aria-label="その他のシャッフル"
        >
          <div class={styles.options}>
            {otherOptions.map((opt) => (
              <StyleOptionButton
                key={opt.id}
                opt={opt}
                value={value}
                disabled={disabled}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      )}
      <p class={styles.description}>{selected.shortDescription}</p>
    </div>
  );
}
