import { useState, useCallback, useRef } from 'preact/hooks';
import { Button } from '../components/Button';
import { ResultPanel } from '../components/ResultPanel';
import { drawHexagram, buildHexagramFrom, type IChingResult, type Line, type CoinThrow } from '../data/iching-meta';
import { TRIGRAM_MAP } from '../data/iching-meta';
import { secureRandomInt } from '../lib/rng';
import { saveHistoryEntry, type IChingHistoryDetail, buildIChingSummary, newHistoryId } from '../lib/history';
import styles from './IChing.module.css';

type Phase = 'idle' | 'throwing' | 'thrown' | 'done';

const LINE_NAME: Record<Line, { label: string; char: string }> = {
  0: { label: '陰', char: '⚋' },
  1: { label: '陽', char: '⚊' },
};

export function IChing() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [coinStates, setCoinStates] = useState<Array<'h' | 't' | null>>([null, null, null]);
  const [result, setResult] = useState<IChingResult | null>(null);
  const [throwLog, setThrowLog] = useState<CoinThrow[]>([]);
  const savedRef = useRef(false);

  const saveResult = useCallback((r: IChingResult) => {
    if (savedRef.current) return;
    savedRef.current = true;
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
  }, []);

  const startThrowing = useCallback(async () => {
    if (phase === 'throwing' || phase === 'thrown') return;
    savedRef.current = false;
    setResult(null);
    setThrowLog([]);
    setPhase('throwing');

    for (let i = 0; i < 6; i++) {
      const startTime = Date.now();
      const totalMs = 700 + secureRandomInt(300);
      let stopped = false;
      const animate = (): Promise<void> =>
        new Promise((resolve) => {
          const tick = () => {
            if (stopped || Date.now() - startTime > totalMs) {
              resolve();
              return;
            }
            setCoinStates([
              secureRandomInt(2) === 1 ? 'h' : 't',
              secureRandomInt(2) === 1 ? 'h' : 't',
              secureRandomInt(2) === 1 ? 'h' : 't',
            ]);
            requestAnimationFrame(tick);
          };
          tick();
        });
      await animate();
      const coins: [0 | 1, 0 | 1, 0 | 1] = [
        secureRandomInt(2) as 0 | 1,
        secureRandomInt(2) as 0 | 1,
        secureRandomInt(2) as 0 | 1,
      ];
      const sum: number = (coins[0] === 1 ? 3 : 2) + (coins[1] === 1 ? 3 : 2) + (coins[2] === 1 ? 3 : 2);
      const line: 0 | 1 = sum === 6 || sum === 8 ? 0 : 1;
      const changing = sum === 6 || sum === 9;
      const final: CoinThrow = { coins, sum, line, changing };
      setThrowLog((prev) => [...prev, final]);
      setCoinStates(coins.map((c) => (c === 1 ? 'h' : 't')));
      await new Promise((r) => setTimeout(r, 400));
      stopped = true;
    }

    const r = drawHexagram();
    const primaryBuilt = buildHexagramFrom(r.primary);
    const changedBuilt = r.changedLine !== null ? buildHexagramFrom(r.changed) : null;
    const builtResult: IChingResult = {
      primary: primaryBuilt,
      changed: changedBuilt,
      changedLine: r.changedLine,
      throws: r.primary,
    };
    setResult(builtResult);
    saveResult(builtResult);
    setPhase('done');
  }, [phase, saveResult]);

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>周易(易経)</h1>
        <p class={styles.lede}>
          コインを 6 回投げて 1 卦を構成。合計が 6 点なら老陰、9 点なら老陽の「変爻」となり、別の卦へと姿を変えます。
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
              <span class={styles.logIdx}>{6 - i}爻</span>
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
          {phase === 'idle' || phase === 'done' ? 'コインを 6 回投げる' : '投げています…'}
        </Button>
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
              title="之卦(変化した卦)"
              subtitle={`${result.changed.hex.num}. ${result.changed.hex.nameJp}`}
              tone="purple"
            >
              {result.changed.hex.theme}
              <p class={styles.judgment}>{result.changed.hex.judgment}</p>
              <p class={styles.changingNote}>
                <strong>第{result.changedLine}爻</strong>に変爻が出ました。
                この爻辞が、現在のあなたへの具体的なメッセージです。
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
                  label="之卦"
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
