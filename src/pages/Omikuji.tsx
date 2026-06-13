import { useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  drawOmikuji,
  FORTUNES,
  CATEGORIES,
  type OmikujiResult,
  type FortuneLevel,
  type FortuneCategory,
} from '../data/omikuji-meta';
import { saveHistoryEntry, type OmikujiHistoryDetail, buildOmikujiSummary, newHistoryId } from '../lib/history';
import { saveTodayDaily, type DailyOmikuji } from '../lib/daily-fortune';
import { useDailyRestore } from '../lib/use-daily-restore';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './Omikuji.module.css';

type Phase = 'idle' | 'shaking' | 'drop' | 'done';

function findLevel(name: string): FortuneLevel | undefined {
  return FORTUNES.find((f) => f.level === name);
}

function findCategory(id: string): FortuneCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

function rebuildResult(stored: DailyOmikuji): OmikujiResult | null {
  const level = findLevel(stored.level);
  if (!level) return null;
  const categories: Array<{ category: FortuneCategory; text: string }> = [];
  for (const c of stored.categories) {
    const cat = findCategory(c.id);
    if (!cat) return null;
    categories.push({ category: cat, text: c.text });
  }
  return { level, categories };
}

function formatOmikujiReading(r: OmikujiResult): string {
  const lines = [
    '【おみくじ】',
    '',
    `■ 今日の運勢: ${r.level.level}`,
    r.level.summary,
    '',
    '■ カテゴリ別',
  ];
  for (const c of r.categories) {
    lines.push(`${c.category.label}: ${c.text}`);
  }
  lines.push('');
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

export function Omikuji() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<OmikujiResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useDailyRestore<DailyOmikuji, OmikujiResult>('omikuji', {
    enabled: phase === 'idle' && result === null,
    resolve: (stored) => rebuildResult(stored),
    apply: (rebuilt) => {
      if (!rebuilt) return;
      setResult(rebuilt);
      setPhase('done');
    },
  });

  const { save: saveResult, reset: resetSave } = useSaveOnce<OmikujiResult>((r) => {
    const detail: OmikujiHistoryDetail = {
      kind: 'omikuji',
      level: r.level.level,
      color: r.level.color,
      summary: r.level.summary,
      categories: r.categories.map((c) => ({ label: c.category.label, text: c.text })),
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'omikuji',
      date: new Date().toISOString(),
      summary: buildOmikujiSummary(r.level.level),
      detail,
    });
  });

  const performDraw = useCallback(() => {
    setConfirmOpen(false);
    resetSave();
    setResult(null);
    setPhase('shaking');
    setTimeout(() => setPhase('drop'), 900);
    setTimeout(() => {
      const r = drawOmikuji();
      setResult(r);
      saveResult(r);
      saveTodayDaily<DailyOmikuji>('omikuji', {
        level: r.level.level,
        color: r.level.color,
        summary: r.level.summary,
        categories: r.categories.map((c) => ({ id: c.category.id, label: c.category.label, text: c.text })),
      });
      setPhase('done');
    }, 1700);
  }, [resetSave, saveResult]);

  const start = useCallback(() => {
    if (phase === 'shaking' || phase === 'drop') return;
    if (phase === 'done' && result !== null) {
      setConfirmOpen(true);
      return;
    }
    performDraw();
  }, [phase, result, performDraw]);

  const readingText = useMemo(
    () => (result && phase === 'done' ? formatOmikujiReading(result) : ''),
    [result, phase],
  );

  const dailyLoaded = phase === 'done' && result !== null;

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
          {phase === 'idle' || phase === 'done'
            ? dailyLoaded ? 'もう一度桶を振る（確認あり）' : '桶を振る'
            : phase === 'shaking' ? '振っています…' : 'おみくじが出てきます…'}
        </Button>
        {result && phase === 'done' && <CopyResultButton text={readingText} />}
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

      {confirmOpen && result && (
        <ConfirmDialog
          title="もう一度引きますか?"
          tone="rose"
          confirmLabel="もう一度引く"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={performDraw}
          body={
            <p>
              今日は「{result.level.level}」を引いています。
            </p>
          }
        />
      )}
    </article>
  );
}
