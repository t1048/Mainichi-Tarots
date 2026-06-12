import type { ComponentChildren } from 'preact';
import styles from './ResultPanel.module.css';

interface Props {
  title: string;
  subtitle?: string;
  keywords?: string[];
  children?: ComponentChildren;
  tone?: 'gold' | 'purple' | 'rose';
}

export function ResultPanel({ title, subtitle, keywords, children, tone = 'gold' }: Props) {
  return (
    <section class={`${styles.panel} ${styles[tone]}`}>
      <header class={styles.head}>
        <h3 class={styles.title}>{title}</h3>
        {subtitle && <p class={styles.subtitle}>{subtitle}</p>}
      </header>
      {keywords && keywords.length > 0 && (
        <ul class={styles.keywords}>
          {keywords.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      )}
      <div class={styles.body}>{children}</div>
    </section>
  );
}
