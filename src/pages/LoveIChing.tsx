import { useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import {
  buildHexagramFrom,
  TRIGRAMS,
  type CoinThrow,
  type HexagramBuilt,
  type Line,
  type Trigram,
} from '../data/iching-meta';
import { saveHistoryEntry, type LoveIChingHistoryDetail, buildLoveIChingSummary, newHistoryId } from '../lib/history';
import { runCoinTossAnimation } from '../lib/iching-toss';
import { useSaveOnce } from '../lib/use-save-once';
import { buildAiCopyText, AI_COPY_LABEL } from '../lib/ai-prompt';
import styles from './LoveIChing.module.css';

const AI_PROMPT =
  '上記の二人の周易の結果を、それぞれの卦と 2 つの組み合わせ卦から、二人の関係性の観点で統合的に読み解いてください。';

type Phase = 'idle-you' | 'throwing-you' | 'done-you' | 'throwing-partner' | 'done';
type Step = 'you' | 'partner';

const STEPS: { key: Step; label: string }[] = [
  { key: 'you', label: 'あなた' },
  { key: 'partner', label: '相手' },
];

const STEP_LABEL: Record<Step, string> = {
  you: 'あなたの 6 投',
  partner: '相手の 6 投',
};

const LINE_NAME: Record<Line, { label: string; char: string }> = {
  0: { label: '陰', char: '⚋' },
  1: { label: '陽', char: '⚊' },
};

function trigramById(hex: HexagramBuilt, part: 'lower' | 'upper'): Trigram | undefined {
  const id = part === 'lower' ? hex.hex.lower : hex.hex.upper;
  return TRIGRAMS.find((t) => t.id === id);
}

function combineHexagrams(
  you: HexagramBuilt,
  partner: HexagramBuilt,
  pattern: 'A' | 'B',
): HexagramBuilt {
  // pattern A: you = 下卦, partner = 上卦
  // pattern B: partner = 下卦, you = 上卦
  const lower = pattern === 'A' ? trigramById(you, 'lower') : trigramById(partner, 'lower');
  const upper = pattern === 'A' ? trigramById(partner, 'upper') : trigramById(you, 'upper');
  if (!lower || !upper) {
    return you;
  }
  const lines: [Line, Line, Line, Line, Line, Line] = [
    lower.lines[0],
    lower.lines[1],
    lower.lines[2],
    upper.lines[0],
    upper.lines[1],
    upper.lines[2],
  ];
  const throws: CoinThrow[] = lines.map((l) => ({
    coins: [0, 0, 0],
    sum: 0,
    line: l,
    changing: false,
  }));
  return buildHexagramFrom(throws);
}

function formatLoveIChingReading(
  yourBuilt: HexagramBuilt,
  partnerBuilt: HexagramBuilt,
  aCombined: HexagramBuilt,
  bCombined: HexagramBuilt,
): string {
  const lines = [
    '【二人の周易】',
    '',
    `■ あなたの卦: ${yourBuilt.hex.num}. ${yourBuilt.hex.nameJp}`,
    yourBuilt.hex.theme,
    yourBuilt.hex.judgment,
    '',
    `■ 相手の卦: ${partnerBuilt.hex.num}. ${partnerBuilt.hex.nameJp}`,
    partnerBuilt.hex.theme,
    partnerBuilt.hex.judgment,
    '',
    `■ 組み合わせ卦 A（あなた下卦 / 相手上卦）: ${aCombined.hex.num}. ${aCombined.hex.nameJp}`,
    aCombined.hex.theme,
    '',
    `■ 組み合わせ卦 B（相手下卦 / あなた上卦）: ${bCombined.hex.num}. ${bCombined.hex.nameJp}`,
    bCombined.hex.theme,
    '',
    '— 毎日タロット＆占い',
  ];
  return lines.join('\n');
}

export function LoveIChing() {
  const [phase, setPhase] = useState<Phase>('idle-you');
  const [coinStates, setCoinStates] = useState<Array<'h' | 't' | null>>([null, null, null]);
  const [throwLog, setThrowLog] = useState<CoinThrow[]>([]);
  const [yourThrows, setYourThrows] = useState<CoinThrow[] | null>(null);
  const [partnerThrows, setPartnerThrows] = useState<CoinThrow[] | null>(null);

  const { save: saveResult, reset: resetSave } = useSaveOnce<{
    yourBuilt: HexagramBuilt;
    partnerBuilt: HexagramBuilt;
    a: HexagramBuilt;
    b: HexagramBuilt;
  }>(({ yourBuilt, partnerBuilt, a, b }) => {
    const detail: LoveIChingHistoryDetail = {
      kind: 'love-iching',
      yourHexNum: yourBuilt.hex.num,
      yourHexName: yourBuilt.hex.nameJp,
      partnerHexNum: partnerBuilt.hex.num,
      partnerHexName: partnerBuilt.hex.nameJp,
      aHexNum: a.hex.num,
      aHexName: a.hex.nameJp,
      bHexNum: b.hex.num,
      bHexName: b.hex.nameJp,
      aJudgment: a.hex.judgment,
      bJudgment: b.hex.judgment,
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'love-iching',
      date: new Date().toISOString(),
      summary: buildLoveIChingSummary(a.hex.nameJp, b.hex.nameJp),
      detail,
    });
  });

  const isStepActive = (s: Step): boolean =>
    (s === 'you' && (phase === 'idle-you' || phase === 'throwing-you')) ||
    (s === 'partner' && phase === 'throwing-partner');

  const isStepDone = (s: Step): boolean =>
    (s === 'you' && (phase === 'done-you' || phase === 'throwing-partner' || phase === 'done')) ||
    (s === 'partner' && phase === 'done');

  const runSixThrows = useCallback(async (): Promise<CoinThrow[]> => {
    return runCoinTossAnimation({
      onDisplay: (states) => setCoinStates(states),
      onThrow: (t, log) => {
        setThrowLog([...log]);
        setCoinStates(t.coins.map((c) => (c === 1 ? 'h' : 't')));
      },
    });
  }, []);

  const startThrowing = useCallback(async () => {
    if (phase === 'throwing-you' || phase === 'throwing-partner') return;
    setThrowLog([]);
    setCoinStates([null, null, null]);

    if (phase === 'idle-you') {
      resetSave();
      setPhase('throwing-you');
      const log = await runSixThrows();
      setYourThrows(log);
      setPhase('done-you');
      return;
    }
    if (phase === 'done-you') {
      setPhase('throwing-partner');
      const log = await runSixThrows();
      setPartnerThrows(log);
      const finalYour = yourThrows ?? [];
      const yourBuilt = buildHexagramFrom(finalYour);
      const partnerBuilt = buildHexagramFrom(log);
      const a = combineHexagrams(yourBuilt, partnerBuilt, 'A');
      const b = combineHexagrams(yourBuilt, partnerBuilt, 'B');
      saveResult({ yourBuilt, partnerBuilt, a, b });
      setPhase('done');
      return;
    }
    if (phase === 'done') {
      // Reset and start over
      setYourThrows(null);
      setPartnerThrows(null);
      setThrowLog([]);
      setCoinStates([null, null, null]);
      setPhase('idle-you');
    }
  }, [phase, yourThrows, runSixThrows, resetSave, saveResult]);

  const showBoard = phase === 'throwing-you' || phase === 'throwing-partner';
  const stepLabel = phase === 'idle-you' || phase === 'throwing-you' || phase === 'done-you'
    ? STEP_LABEL.you
    : STEP_LABEL.partner;

  const isComplete = phase === 'done' && yourThrows && partnerThrows;
  const yourBuilt = yourThrows ? buildHexagramFrom(yourThrows) : null;
  const partnerBuilt = partnerThrows ? buildHexagramFrom(partnerThrows) : null;
  const aCombined = yourBuilt && partnerBuilt ? combineHexagrams(yourBuilt, partnerBuilt, 'A') : null;
  const bCombined = yourBuilt && partnerBuilt ? combineHexagrams(yourBuilt, partnerBuilt, 'B') : null;

  const readingText = useMemo(() => {
    if (!isComplete || !yourBuilt || !partnerBuilt || !aCombined || !bCombined) return '';
    return formatLoveIChingReading(yourBuilt, partnerBuilt, aCombined, bCombined);
  }, [isComplete, yourBuilt, partnerBuilt, aCombined, bCombined]);

  const aiReadingText = useMemo(() => buildAiCopyText(readingText, AI_PROMPT), [readingText]);

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>二人の周易</h1>
        <p class={styles.lede}>
          2 人で 6 投 × 2 = 12 投。あなたの卦と相手の卦が出たら、
          上下卦を入れ替えて 2 つの組み合わせ卦を生成します。
        </p>
      </header>

      <div class={styles.progress} aria-label="進行状況">
        {STEPS.map((s) => (
          <span
            key={s.key}
            class={`${styles.progressStep} ${isStepActive(s.key) ? styles.progressStepActive : ''} ${isStepDone(s.key) ? styles.progressStepDone : ''}`}
          >
            {isStepDone(s.key) ? '✓ ' : ''}{s.label}
          </span>
        ))}
      </div>

      {showBoard && (
        <section class={styles.coinStage} aria-live="polite">
          <div>
            <p class={styles.coinHeader}>{stepLabel}</p>
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
          </div>
          <div class={styles.log}>
            {throwLog.length === 0 && (
              <p class={styles.muted}>「{STEP_LABEL.you}」または「{STEP_LABEL.partner}」ボタンを押すと開始</p>
            )}
            {throwLog.map((t, i) => (
              <div class={styles.logRow} key={i}>
                <span class={styles.logIdx}>{6 - i}の線</span>
                <span class={styles.logLine}>
                  {t.line === 1 ? '━━━━' : '━ ━━ ━'}
                </span>
                <span class={styles.logVal}>{t.sum}点</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div class={styles.action}>
        <Button
          onClick={startThrowing}
          size="lg"
          loading={phase === 'throwing-you' || phase === 'throwing-partner'}
        >
          {phase === 'idle-you' && 'あなたの 6 投を始める'}
          {phase === 'throwing-you' && '投げています…'}
          {phase === 'done-you' && '相手の 6 投を始める'}
          {phase === 'throwing-partner' && '投げています…'}
          {phase === 'done' && 'もう一度'}
        </Button>
        {isComplete && (
          <CopyResultButton text={aiReadingText} label={AI_COPY_LABEL} />
        )}
      </div>

      {isComplete && yourBuilt && partnerBuilt && aCombined && bCombined && (
        <section class={styles.results}>
          <div class={styles.duoSummary}>
            <div class={`${styles.hexagramCard} ${styles.you}`}>
              <h3>あなたの卦</h3>
              <span class={styles.hexName}>{yourBuilt.hex.num}. {yourBuilt.hex.nameJp}</span>
              <p class={styles.hexTheme}>{yourBuilt.hex.theme}</p>
              <p class={styles.judgment}>{yourBuilt.hex.judgment}</p>
            </div>
            <div class={`${styles.hexagramCard} ${styles.partner}`}>
              <h3>相手の卦</h3>
              <span class={styles.hexName}>{partnerBuilt.hex.num}. {partnerBuilt.hex.nameJp}</span>
              <p class={styles.hexTheme}>{partnerBuilt.hex.theme}</p>
              <p class={styles.judgment}>{partnerBuilt.hex.judgment}</p>
            </div>
          </div>

          <div class={styles.arrowRow}>あなたの卦と相手の卦から、組み合わせ卦を生成</div>

          <div class={styles.hexagrams}>
            <HexBlock hex={aCombined} label="あなたから見た二人" />
            <span class={styles.arrow} aria-hidden="true">↔</span>
            <HexBlock hex={bCombined} label="相手から見た二人" />
          </div>

          <ResultPanel
            title="組み合わせ卦 A: あなたから見た二人"
            subtitle={`${aCombined.hex.num}. ${aCombined.hex.nameJp} (あなた下卦 / 相手上卦)`}
            tone="rose"
          >
            {aCombined.hex.theme}
          </ResultPanel>

          <ResultPanel
            title="組み合わせ卦 B: 相手から見た二人"
            subtitle={`${bCombined.hex.num}. ${bCombined.hex.nameJp} (相手下卦 / あなた上卦)`}
            tone="purple"
          >
            {bCombined.hex.theme}
          </ResultPanel>
        </section>
      )}
    </article>
  );
}

function HexBlock({ hex, label }: { hex: HexagramBuilt; label: string }) {
  return (
    <div class={styles.hexBlock}>
      <span class={styles.hexLabel}>{label}</span>
      <span class={styles.hexBlockName}>{hex.hex.nameJp}</span>
      <div class={styles.hexLines}>
        {[...hex.lines].reverse().map((l, displayIdx) => {
          const realLine = 6 - displayIdx;
          return (
            <div key={displayIdx} class={styles.line}>
              <span class={styles.lineIndex}>{realLine}</span>
              <span class={styles.lineSymbol}>{LINE_NAME[l].char}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
