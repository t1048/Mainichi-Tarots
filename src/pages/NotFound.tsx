import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <article class={styles.page}>
      <h1>迷子の星</h1>
      <p>そのルートはないようです。ナビゲーションから戻りませんか。</p>
      <a class={styles.link} href="#/">
        ← ホームへ
      </a>
    </article>
  );
}
