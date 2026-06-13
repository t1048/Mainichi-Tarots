import { useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  buildIChingResult,
  TRIGRAM_MAP,
  type CoinThrow,
  type IChingResult,
  type Line,
} from '../data/iching-meta';
import { saveHistoryEntry, type IChingHistoryDetail, buildIChingSummary, newHistoryId } from '../lib/history';
import { saveTodayDaily, type DailyIChing } from '../lib/daily-fortune';
import { runCoinTossAnimation } from '../lib/iching-toss';
import { useDailyRestore } from '../lib/use-daily-restore';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './IChing.module.css';

type Phase = 'idle' | 'throwing' | 'thrown' | 'done';

const LINE_NAME: Record<Line, { label: string; char: string }> = {
  0: { label: '陰', char: '⚋' },
  1: { label: '陽', char: '⚊' },
};

function rebuildResult(stored: DailyIChing): IChingResult | null {
  if (stored.primaryThrows.length !== 6) return null;
  return buildIChingResult(stored.primaryThrows);
}

function formatIChingReading(r: IChingResult): string {
  const lines = [
    '【周易(易経)】',
    '',
    `■ 本卦: ${r.primary.hex.num}. ${r.primary.hex.nameJp}`,
    r.primary.hex.theme,
    r.primary.hex.judgment,
  ];
  if (r.changed) {
    lines.push('');
    lines.push(`■ 変化した卦: ${r.changed.hex.num}. ${r.changed.hex.nameJp}`);
    lines.push(r.changed.hex.theme);
    lines.push(r.changed.hex.judgment);
    if (r.changedLine !== null) {
      lines.push(`第${r.changedLine}の線に変化が出ました。`);
    }
  }
  lines.push('');
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

export function IChing() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [coinStates, setCoinStates] = useState<Array<'h' | 't' | null>>([null, null, null]);
  const [result, setResult] = useState<IChingResult | null>(null);
  const [throwLog, setThrowLog] = useState<CoinThrow[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useDailyRestore<DailyIChing, IChingResult>('iching', {
    enabled: phase === 'idle' && result === null,
    resolve: (stored) => rebuildResult(stored),
    apply: (rebuilt) => {
      if (!rebuilt) return;
      const finalThrow = rebuilt.throws[rebuilt.throws.length - 1];
      setCoinStates(finalThrow.coins.map((c) => (c === 1 ? 'h' : 't')));
      setThrowLog(rebuilt.throws);
      setResult(rebuilt);
      setPhase('done');
    },
  });

  const { save: saveResult, reset: resetSave } = useSaveOnce<IChingResult>((r) => {
    const detail: IChingHistoryDetail = {
      kind: 'iching',
      primaryNum: r.primary.hex.num,
      primaryName: r.primary.hex.nameJp,
      changedNum: r.changed?.hex.num ?? null,
      changedName: r.changed?.hex.nameJp ?? null,
      changedLine: r.changedLine,
      judgment: r.primary.hex.judgment,
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'iching',
      date: new Date().toISOString(),
      summary: buildIChingSummary(r.primary.hex.nameJp, r.changed?.hex.nameJp ?? null),
      detail,
    });
  });

  const performDraw = useCallback(async () => {
    setConfirmOpen(false);
    resetSave();
    setResult(null);
    setThrowLog([]);
    setPhase('throwing');

    const collected = await runCoinTossAnimation({
      onDisplay: (states) => setCoinStates(states),
      onThrow: (t) => {
        setThrowLog((prev) => [...prev, t]);
        setCoinStates(t.coins.map((c) => (c === 1 ? 'h' : 't')));
      },
    });

    const builtResult = buildIChingResult(collected);
    setResult(builtResult);
    saveResult(builtResult);
    saveTodayDaily<DailyIChing>('iching', {
      primaryThrows: collected,
      changedLine: builtResult.changedLine,
    });
    setPhase('done');
  }, [resetSave, saveResult]);

  const startThrowing = useCallback(() => {
    if (phase === 'throwing' || phase === 'thrown') return;
    if (phase === 'done' && result !== null) {
      setConfirmOpen(true);
      return;
    }
    void performDraw();
  }, [phase, result, performDraw]);

  const readingText = useMemo(
    () => (result && phase === 'done' ? formatIChingReading(result) : ''),
    [result, phase],
  );

  const dailyLoaded = phase === 'done' && result !== null;

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>周易(易経)</h1>
        <p class={styles.lede}>
          コインを 6 回投げて 1 卦を構成。合計が 6 点なら老陰、9 点なら老陽の「変化の線」となり、別の卦へと姿を変えます。
        </p>
      </header>

      <div class={styles.coinStage} aria-live="polite">
        <div class={styles.coins}>
          {coinStates.map((s, i) => (
            <div
              key={i}
              class={`${styles.coin} ${s ? styles.landed : ''} ${
                s === 'h' ? styles.head : s === 't' ? styles.tail : styles.idle
              }`}
            >
              <span class={styles.coinMark}>{s === 'h' ? '背' : s === 't' ? '字' : '?'}</span>
            </div>
          ))}
        </div>
        <div class={styles.log}>
          {throwLog.length === 0 && <p class={styles.muted}>「コインを 6 回投げる」を押すと開始します</p>}
          {throwLog.map((t, i) => (
            <div class={styles.logRow} key={i}>
              <span class={styles.logIdx}>{6 - i}の線</span>
              <span class={styles.logLine}>
                {t.line === 1 ? '━━━━' : '━ ━━ ━'}
                {t.changing && <span class={styles.changing}>{t.line === 1 ? '→━ ━━ ━' : '→━━━━'}</span>}
              </span>
              <span class={styles.logVal}>{t.sum}点</span>
            </div>
          ))}
        </div>
      </div>

      <div class={styles.action}>
        <Button onClick={startThrowing} size="lg" loading={phase === 'throwing'}>
          {phase === 'idle' || phase === 'done'
            ? dailyLoaded ? 'もう一度 6 回投げる（確認あり）' : 'コインを 6 回投げる'
            : '投げています…'}
        </Button>
        {result && phase === 'done' && <CopyResultButton text={readingText} />}
      </div>

      {result && phase === 'done' && (
        <section class={styles.results}>
          <ResultPanel
            title="本卦(もとの卦)"
            subtitle={`${result.primary.hex.num}. ${result.primary.hex.nameJp}`}
            tone="gold"
          >
            {result.primary.hex.theme}
            <p class={styles.judgment}>{result.primary.hex.judgment}</p>
          </ResultPanel>

          {result.changed && (
            <ResultPanel
            title="変化した卦"
            subtitle={`${result.changed.hex.num}. ${result.changed.hex.nameJp}`}
            tone="purple"
          >
            {result.changed.hex.theme}
            <p class={styles.judgment}>{result.changed.hex.judgment}</p>
            <p class={styles.changingNote}>
              <strong>第{result.changedLine}の線</strong>に変化が出ました。
              この部分が、現在のあなたへの具体的なメッセージです。
            </p>
            </ResultPanel>
          )}

          <div class={styles.hexagrams}>
            <HexagramView
              lines={result.primary.lines}
              changedIndex={result.changedLine}
              label="本卦"
              hexName={result.primary.hex.nameJp}
            />
            {result.changed && (
              <>
                <div class={styles.arrow} aria-hidden="true">→</div>
                <HexagramView
                  lines={result.changed.lines}
                  changedIndex={null}
                  label="変化した卦"
                  hexName={result.changed.hex.nameJp}
                />
              </>
            )}
          </div>

          <div class={styles.trigramInfo}>
            <h3>八卦構成</h3>
            <div class={styles.trigramRow}>
              <span>上卦: {TRIGRAM_MAP[result.primary.hex.upper]?.nameJp}({TRIGRAM_MAP[result.primary.hex.upper]?.nature})</span>
              <span>下卦: {TRIGRAM_MAP[result.primary.hex.lower]?.nameJp}({TRIGRAM_MAP[result.primary.hex.lower]?.nature})</span>
            </div>
          </div>
        </section>
      )}

      <section class={styles.legend}>
        <h2>卦の読み方</h2>
        <ul>
          <li><strong>老陽 (9)</strong>: 陽の極み。これからの変化は陰へ。</li>
          <li><strong>少陽 (7)</strong>: 安定した陽。変化なし。</li>
          <li><strong>少陰 (8)</strong>: 安定した陰。変化なし。</li>
          <li><strong>老陰 (6)</strong>: 陰の極み。これからの変化は陽へ。</li>
        </ul>
      </section>

      {confirmOpen && result && (
        <ConfirmDialog
          title="もう一度引きますか?"
          tone="indigo"
          confirmLabel="もう一度引く"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={performDraw}
          body={
            <p>
              今日は「{result.primary.hex.nameJp}{result.changed ? ` → ${result.changed.hex.nameJp}` : ''}」を引いています
              {result.changedLine !== null ? `（第${result.changedLine}の線が変化）` : ''}。
            </p>
          }
        />
      )}
    </article>
  );
}

function HexagramView({
  lines,
  changedIndex,
  label,
  hexName,
}: {
  lines: [Line, Line, Line, Line, Line, Line];
  changedIndex: number | null;
  label: string;
  hexName: string;
}) {
  return (
    <div class={styles.hexBlock}>
      <span class={styles.hexLabel}>{label}</span>
      <span class={styles.hexName}>{hexName}</span>
      <div class={styles.hexLines}>
        {[...lines].reverse().map((l, displayIdx) => {
          const realLine = 6 - displayIdx;
          const isChanging = changedIndex === realLine;
          return (
            <div
              key={displayIdx}
              class={`${styles.line} ${l === 1 ? styles.yang : styles.yin} ${isChanging ? styles.changingLine : ''}`}
            >
              <span class={styles.lineIndex}>{realLine}</span>
              <span class={styles.lineSymbol}>{LINE_NAME[l].char}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
