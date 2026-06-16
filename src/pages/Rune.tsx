import { useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RuneStone } from '../components/RuneStone';
import {
  RUNES,
  findRune,
  type RuneResult,
  type RunePosition,
  interpretRune,
  RUNE_POSITION_LABEL,
} from '../data/rune-meta';
import { orientationLabel } from '../data/tarot-meta';
import { secureRandomInt, chance } from '../lib/rng';
import { saveHistoryEntry, type RuneHistoryDetail, buildRuneSummary, newHistoryId } from '../lib/history';
import { saveTodayDaily, type DailyRune } from '../lib/daily-fortune';
import { useDailyRestore } from '../lib/use-daily-restore';
import { useSaveOnce } from '../lib/use-save-once';
import { buildAiCopyText, AI_COPY_LABEL } from '../lib/ai-prompt';
import styles from './Rune.module.css';

const AI_PROMPT =
  '上記のルーン占いの結果を、状況・障害・助言の流れを踏まえて統合的に読み解いてください。';

type Phase = 'idle' | 'drawing' | 'revealing' | 'done';

const POSITIONS: RunePosition[] = ['situation', 'obstacle', 'advice'];

function drawRune(): RuneResult {
  const rune = RUNES[secureRandomInt(RUNES.length)];
  return { rune, orientation: chance(0.5) ? 'upright' : 'reversed', position: 'situation' };
}

function rebuildResults(stored: DailyRune): RuneResult[] {
  const out: RuneResult[] = [];
  for (const r of stored.results) {
    const rune = findRune(r.runeId);
    if (!rune) return [];
    out.push({ rune, orientation: r.orientation, position: r.position });
  }
  return out;
}

function formatRuneReading(picked: RuneResult[]): string {
  const lines = ['【ルーン占い】', ''];
  for (const r of picked) {
    lines.push(`■ ${RUNE_POSITION_LABEL[r.position]} — ${r.rune.nameJp}（${r.rune.nameOrigin}）`);
    lines.push(orientationLabel(r.orientation));
    if (r.rune.keywords.length > 0) {
      lines.push(`キーワード: ${r.rune.keywords.join(' / ')}`);
    }
    lines.push(interpretRune(r));
    lines.push('');
  }
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

export function Rune() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [results, setResults] = useState<RuneResult[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useDailyRestore<DailyRune, RuneResult[]>('rune', {
    enabled: phase === 'idle' && results.length === 0,
    resolve: (stored) => rebuildResults(stored),
    apply: (rebuilt) => {
      if (rebuilt.length !== 3) return;
      setResults(rebuilt);
      setRevealIndex(3);
      setPhase('done');
    },
  });

  const { save: saveResults, reset: resetSave } = useSaveOnce<RuneResult[]>((picked) => {
    const interpretation = picked
      .map((r) => `[${RUNE_POSITION_LABEL[r.position]}] ${interpretRune(r)}`)
      .join('\n\n');
    const detail: RuneHistoryDetail = {
      kind: 'rune',
      results: picked,
      interpretation,
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'rune',
      date: new Date().toISOString(),
      summary: buildRuneSummary(picked),
      detail,
    });
  });

  const performDraw = useCallback(() => {
    setConfirmOpen(false);
    resetSave();
    setResults([]);
    setRevealIndex(0);
    setPhase('drawing');
    setTimeout(() => {
      const picked: RuneResult[] = [];
      for (let i = 0; i < 3; i++) {
        const r = drawRune();
        r.position = POSITIONS[i];
        picked.push(r);
      }
      setResults(picked);
      setPhase('revealing');
      let i = 0;
      const tick = () => {
        i += 1;
        setRevealIndex(i);
        if (i < picked.length) {
          setTimeout(tick, 600);
        } else {
          setPhase('done');
          saveResults(picked);
          saveTodayDaily<DailyRune>('rune', {
            results: picked.map((r) => ({
              runeId: r.rune.id,
              orientation: r.orientation,
              position: r.position,
            })),
          });
        }
      };
      setTimeout(tick, 400);
    }, 700);
  }, [resetSave, saveResults]);

  const startReading = useCallback(() => {
    if (phase === 'drawing' || phase === 'revealing') return;
    if (phase === 'done' && results.length === 3) {
      setConfirmOpen(true);
      return;
    }
    performDraw();
  }, [phase, results.length, performDraw]);

  const readingText = useMemo(
    () => (phase === 'done' && results.length === 3 ? formatRuneReading(results) : ''),
    [phase, results],
  );

  const aiReadingText = useMemo(() => buildAiCopyText(readingText, AI_PROMPT), [readingText]);

  const dailyLoaded = phase === 'done' && results.length === 3;

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>ルーン占い</h1>
        <p class={styles.lede}>
          古代北欧の 24 ルーン + 白紙の「ヴィルド」。3 つの石を引いて、<br />
          状況 → 障害 → 助言 の流れを読み解きます。
        </p>
      </header>

      <div class={styles.action}>
        <Button onClick={startReading} size="lg" loading={phase === 'drawing'} disabled={phase === 'revealing'}>
          {phase === 'idle' || phase === 'done'
            ? dailyLoaded ? 'もう一度 3 つの石を引く（確認あり）' : '3 つの石を引く'
            : phase === 'drawing' ? '石を引いています…' : '石をめくっています…'}
        </Button>
        {phase === 'done' && results.length === 3 && (
          <>
            <CopyResultButton text={readingText} />
            <CopyResultButton text={aiReadingText} label={AI_COPY_LABEL} variant="ghost" />
          </>
        )}
      </div>

      <div class={styles.stones} aria-live="polite">
        {POSITIONS.map((pos, i) => {
          const result = results[i];
          const revealed = !!result && i < revealIndex;
          return (
            <div class={styles.stoneSlot} key={pos}>
              <span class={styles.label}>{RUNE_POSITION_LABEL[pos]}</span>
              <div class={`${styles.stoneWrap} ${revealed ? styles.revealed : styles.covered}`}>
                {(phase === 'drawing' || phase === 'idle' || (phase === 'revealing' && i >= revealIndex)) && (
                  <div class={styles.back}>
                    <RuneStone rune={RUNES[0]} size="md" />
                    <div class={styles.veil} />
                  </div>
                )}
                {revealed && result && (
                  <div class={`${styles.front} ${result.orientation === 'reversed' ? styles.flipped : ''}`}>
                    <RuneStone rune={result.rune} size="md" glow />
                  </div>
                )}
              </div>
              {revealed && result && (
                <p class={styles.stoneMeta}>
                  <strong>{result.rune.nameJp}</strong>
                  <span class={styles.orient}>
                    {orientationLabel(result.orientation)}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'done' && results.length === 3 && (
        <section class={styles.results}>
          {results.map((r) => (
            <ResultPanel
              key={`${r.rune.id}-${r.position}`}
              title={`${RUNE_POSITION_LABEL[r.position]}の石`}
              subtitle={`${r.rune.nameJp} · ${r.rune.nameOrigin} · ${orientationLabel(r.orientation)}`}
              keywords={r.rune.keywords}
              tone="purple"
            >
              {interpretRune(r)}
            </ResultPanel>
          ))}
        </section>
      )}

      <section class={styles.gallery}>
        <h2>ルーン一覧</h2>
        <p class={styles.muted}>25 ルーンすべての意味を一覧で確認できます。</p>
        <ul class={styles.galleryList}>
          {RUNES.map((r) => (
            <li key={r.id} class={styles.galleryItem}>
              <RuneStone rune={r} size="sm" />
              <div>
                <strong>{r.nameJp}</strong>
                <small class={styles.muted}>{r.nameOrigin}</small>
                <div class={styles.keywords}>
                  {r.keywords.map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {confirmOpen && results.length === 3 && (
        <ConfirmDialog
          title="もう一度引きますか?"
          tone="purple"
          confirmLabel="もう一度引く"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={performDraw}
          body={
            <p>
              今日は「{results.map((r) => r.rune.nameJp).join(' / ')}」を引いています。
            </p>
          }
        />
      )}
    </article>
  );
}
