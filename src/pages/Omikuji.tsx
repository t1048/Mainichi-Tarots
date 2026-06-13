import { useState, useCallback } from 'preact/hooks';
import { Button } from '../components/Button';
import { ResultPanel } from '../components/ResultPanel';
import { drawOmikuji, type OmikujiResult } from '../data/omikuji-meta';
import styles from './Omikuji.module.css';

type Phase = 'idle' | 'shaking' | 'drop' | 'done';

export function Omikuji() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<OmikujiResult | null>(null);

  const start = useCallback(() => {
    if (phase === 'shaking' || phase === 'drop') return;
    setResult(null);
    setPhase('shaking');
    setTimeout(() => setPhase('drop'), 900);
    setTimeout(() => {
      setResult(drawOmikuji());
      setPhase('done');
    }, 1700);
  }, [phase]);

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>おみくじ</h1>
        <p class={styles.lede}>おみくじを振って、今日の運勢と願い事・健康など 11 カテゴリの運勢を引きましょう。</p>
   
      </header>

      <div class={styles.stage} aria-live="polite">
        <div class={`${styles.bucket} ${phase === 'shaking' ? styles.shaking : ''}`}>
          <div class={styles.bucketBody}>
            <span class={styles.bucketMark} aria-hidden="true">おみくじ</span>
          </div>
          <div class={styles.bucketRim} />
          <div class={styles.bucketShadow} />
        </div>
        <div class={`${styles.stick} ${phase === 'drop' || phase === 'done' ? styles.dropping : ''}`}>
          <div class={styles.stickBody}>
            <span class={styles.stickText}>{result?.level.level ?? '?'}</span>
          </div>
        </div>
      </div>

      <div class={styles.action}>
        <Button onClick={start} size="lg" loading={phase === 'shaking'} disabled={phase === 'drop'}>
          {phase === 'idle' || phase === 'done' ? '桶を振る' : phase === 'shaking' ? '振っています…' : 'おみくじが出てきます…'}
        </Button>
      </div>

      {result && phase === 'done' && (
        <section class={styles.results}>
          <div
            class={styles.bigResult}
            style={{
              ['--fortune-color' as string]: result.level.color,
            }}
          >
            <span class={styles.bigLabel}>今日の運勢</span>
            <span class={styles.bigLevel}>{result.level.level}</span>
            <p class={styles.bigSummary}>{result.level.summary}</p>
          </div>

          <h2 class={styles.catTitle}>カテゴリ別の運勢</h2>
          <div class={styles.catGrid}>
            {result.categories.map((c) => (
              <ResultPanel
                key={c.category.id}
                title={c.category.label}
                tone="rose"
              >
                {c.text}
              </ResultPanel>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
