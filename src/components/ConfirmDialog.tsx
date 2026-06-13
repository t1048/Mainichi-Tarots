import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

type Tone = 'gold' | 'purple' | 'rose' | 'indigo';

interface Props {
  title: string;
  body: ComponentChildren;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'キャンセル',
  tone = 'gold',
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cancelBtn = dialogRef.current?.querySelector<HTMLButtonElement>(
      '[data-confirm-cancel]',
    );
    cancelBtn?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div class={styles.overlay} onClick={onCancel} role="presentation">
      <div
        ref={dialogRef}
        class={`${styles.modal} ${styles[tone]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={(e) => e.stopPropagation()}
      >
        <header class={styles.header}>
          <h2 id="confirm-title" class={styles.title}>{title}</h2>
        </header>
        <div id="confirm-body" class={styles.body}>
          <div class={styles.bodyInner}>{body}</div>
          <p class={styles.note}>占いは 1 日 1 回が基本です。</p>
        </div>
        <footer class={styles.footer}>
          <Button data-confirm-cancel variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </footer>
      </div>
    </div>
  );
}
