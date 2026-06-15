import { useEffect, useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import {
  orientationLabel,
  POSITION_LABELS,
  type TarotCard,
  type Orientation,
  type Position,
} from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { drawTarotOrientation, drawUniqueTarotCards } from '../lib/tarot-draw';
import {
  saveHistoryEntry,
  type LoveTarotHistoryDetail,
  buildLoveTarotSummary,
  buildLoveTarotSpreadSummary,
  newHistoryId,
  type LoveTarotMode,
  type TarotDrawn,
} from '../lib/history';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './LoveTarot.module.css';

type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';
type LoveSide = 'you' | 'partner';

interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  side: LoveSide;
  position: Position;
}

const SIDE_LABELS: Record<LoveSide, string> = {
  you: 'あなた',
  partner: '相手',
};

const SPREAD_POSITIONS: Position[] = ['past', 'present', 'future'];

const AI_PROMPT_HINT =
  '上記のタロット相性占いの結果を、二人の関係性（過去の経緯・今の関係・これからの展開）の観点から統合的に読み解いてください。';

function toneOf(d: DrawnCard) {
  return d.orientation === 'upright' ? d.card.upright : d.card.reversed;
}

function findCommonKeyword(a: string[], b: string[]): string | null {
  for (const ka of a) {
    const norm = ka.replace(/[、。・\s]/g, '');
    for (const kb of b) {
      if (norm && norm === kb.replace(/[、。・\s]/g, '')) return ka;
    }
  }
  return null;
}

function pickFirst<T>(arr: T[], fallback: T): T {
  return arr.length > 0 ? arr[0] : fallback;
}

function summarize(a: DrawnCard, b: DrawnCard): { commonTheme: string; complement: string; tension: string } {
  const aTone = toneOf(a);
  const bTone = toneOf(b);
  const common = findCommonKeyword(aTone.keywords, bTone.keywords);

  if (common) {
    return {
      commonTheme: `二人のあいだに「${common}」という共通のテーマがあります。`,
      complement: `お互いがこのテーマを大切にしているからこそ、自然に引き合う縁です。`,
      tension: `ただし、同じテーマを同時に強く求めると、時に主導権のすれ違いが生まれます。`,
    };
  }

  const aFirst = pickFirst(aTone.keywords, '前進');
  const bFirst = pickFirst(bTone.keywords, '安定');
  return {
    commonTheme: `二人のあいだに共通のキーワードは見当たりませんが、それが互いの刺激になります。`,
    complement: `あなたの「${aFirst}」を、相手は「${bFirst}」として補い合えます。`,
    tension: `刺激が大きい分、時には歩幅の違いに焦りや不満を感じやすい組み合わせです。`,
  };
}

function toTarotDrawn(cards: DrawnCard[]): TarotDrawn[] {
  return cards.map((d) => ({
    card: d.card,
    orientation: d.orientation,
    position: d.position,
  }));
}

function formatPairReading(drawn: DrawnCard[]): string {
  const summary = summarize(drawn[0], drawn[1]);
  const lines = ['【タロット相性占い — 1 枚 × 1 枚】', ''];
  lines.push(`■ 共通テーマ\n${summary.commonTheme}`);
  lines.push(`■ 補完関係\n${summary.complement}`);
  lines.push(`■ 緊張点\n${summary.tension}`);
  lines.push('');
  for (const d of drawn) {
    const txt = interpret(d.card, d.orientation, d.position);
    lines.push(`■ ${SIDE_LABELS[d.side]} — ${d.card.nameJp}（${orientationLabel(d.orientation)}）`);
    if (txt.keywords.length > 0) {
      lines.push(`キーワード: ${txt.keywords.join(' / ')}`);
    }
    lines.push(txt.body);
    lines.push('');
  }
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

function formatSpreadReading(drawn: DrawnCard[]): string {
  const lines = ['【タロット相性占い — 3 枚 × 3 枚】', ''];
  for (const side of ['you', 'partner'] as const) {
    const sideCards = drawn.filter((d) => d.side === side);
    lines.push(`■ ${SIDE_LABELS[side]}のスプレッド（過去 / 現在 / 未来）`);
    for (const d of sideCards) {
      const txt = interpret(d.card, d.orientation, d.position);
      lines.push(`  ${POSITION_LABELS[d.position]} — ${d.card.nameJp}（${orientationLabel(d.orientation)}）`);
      if (txt.keywords.length > 0) {
        lines.push(`  キーワード: ${txt.keywords.join(' / ')}`);
      }
      lines.push(`  ${txt.body}`);
      lines.push('');
    }
  }
  lines.push('—');
  lines.push('以下の文を生成 AI（ChatGPT・Claude・Gemini など）に貼り付けて、二人の関係性の解説を依頼できます。');
  lines.push(AI_PROMPT_HINT);
  lines.push('');
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

function drawCards(mode: LoveTarotMode): DrawnCard[] {
  if (mode === 'pair') {
    const picked = drawUniqueTarotCards(2);
    return [
      { card: picked[0], orientation: drawTarotOrientation(), side: 'you', position: 'today' },
      { card: picked[1], orientation: drawTarotOrientation(), side: 'partner', position: 'today' },
    ];
  }
  const picked = drawUniqueTarotCards(6);
  const cards: DrawnCard[] = [];
  for (let i = 0; i < 3; i++) {
    cards.push({
      card: picked[i],
      orientation: drawTarotOrientation(),
      side: 'you',
      position: SPREAD_POSITIONS[i],
    });
  }
  for (let i = 0; i < 3; i++) {
    cards.push({
      card: picked[i + 3],
      orientation: drawTarotOrientation(),
      side: 'partner',
      position: SPREAD_POSITIONS[i],
    });
  }
  return cards;
}

function expectedCardCount(mode: LoveTarotMode): number {
  return mode === 'pair' ? 2 : 6;
}

export function LoveTarot() {
  const [mode, setMode] = useState<LoveTarotMode>('pair');
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);

  const { save: saveReading, reset: resetSave } = useSaveOnce<{ mode: LoveTarotMode; cards: DrawnCard[] }>(
    ({ mode: savedMode, cards }) => {
      if (savedMode === 'pair') {
        const [a, b] = cards;
        const summary = summarize(a, b);
        const detail: LoveTarotHistoryDetail = {
          kind: 'love-tarot',
          mode: 'pair',
          you: { card: a.card, orientation: a.orientation, position: a.position },
          partner: { card: b.card, orientation: b.orientation, position: b.position },
          commonTheme: summary.commonTheme,
          complement: summary.complement,
          tension: summary.tension,
        };
        saveHistoryEntry({
          id: newHistoryId(),
          kind: 'love-tarot',
          date: new Date().toISOString(),
          summary: buildLoveTarotSummary(detail.you, detail.partner),
          detail,
        });
        return;
      }
      const youSpread = toTarotDrawn(cards.filter((c) => c.side === 'you'));
      const partnerSpread = toTarotDrawn(cards.filter((c) => c.side === 'partner'));
      const detail: LoveTarotHistoryDetail = {
        kind: 'love-tarot',
        mode: 'spread',
        youSpread,
        partnerSpread,
      };
      saveHistoryEntry({
        id: newHistoryId(),
        kind: 'love-tarot',
        date: new Date().toISOString(),
        summary: buildLoveTarotSpreadSummary(youSpread, partnerSpread),
        detail,
      });
    },
  );

  const handleModeSwitch = (next: LoveTarotMode) => {
    if (next === mode) return;
    setMode(next);
    setDrawn([]);
    setPhase('idle');
    resetSave();
  };

  const startReading = useCallback(() => {
    if (phase === 'shuffling' || phase === 'revealing') return;
    resetSave();
    setDrawn([]);
    setPhase('shuffling');
    const cards = drawCards(mode);
    setTimeout(() => {
      setDrawn(cards);
      setPhase('revealing');
    }, mode === 'pair' ? 700 : 900);
  }, [phase, mode, resetSave]);

  useEffect(() => {
    if (phase !== 'revealing') return undefined;
    const count = expectedCardCount(mode);
    const t = setTimeout(() => {
      setPhase('done');
      if (drawn.length === count) {
        saveReading({ mode, cards: drawn });
      }
    }, mode === 'pair' ? 900 : 2200);
    return () => clearTimeout(t);
  }, [phase, drawn, mode, saveReading]);

  const readingText = useMemo(() => {
    const count = expectedCardCount(mode);
    if (phase !== 'done' || drawn.length !== count) return '';
    return mode === 'pair' ? formatPairReading(drawn) : formatSpreadReading(drawn);
  }, [phase, drawn, mode]);

  const showBoard = (phase === 'revealing' || phase === 'done') && drawn.length === expectedCardCount(mode);
  const showResults = phase === 'done' && drawn.length === expectedCardCount(mode);

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>タロット相性占い</h1>
        <p class={styles.lede}>
          {mode === 'pair'
            ? '2 枚のカードを引いて、あなたと相手の関係性を読み解きます。共通テーマ・補完関係・緊張点の 3 つの視点で整理します。'
            : 'あなたと相手それぞれ 3 枚（過去 / 現在 / 未来）を引き、二人の関係の流れをカードで示します。組み合わせ解説は結果コピーから生成 AI へ依頼できます。'}
        </p>
      </header>

      <div class={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'pair'}
          class={`${styles.tab} ${mode === 'pair' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('pair')}
        >
          <span class={styles.tabMark}>Ⅱ</span>
          <span class={styles.tabText}>1 枚 × 1 枚</span>
        </button>
        <button
          role="tab"
          aria-selected={mode === 'spread'}
          class={`${styles.tab} ${mode === 'spread' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('spread')}
        >
          <span class={styles.tabMark}>Ⅵ</span>
          <span class={styles.tabText}>3 枚 × 3 枚（過去 / 現在 / 未来）</span>
        </button>
      </div>

      <div class={styles.action}>
        <Button
          onClick={startReading}
          size="lg"
          loading={phase === 'shuffling'}
          disabled={phase === 'revealing'}
        >
          {phase === 'idle' || phase === 'done'
            ? mode === 'pair'
              ? '2 枚のカードを引く'
              : '6 枚のカードを引く'
            : phase === 'shuffling'
              ? 'シャッフル中…'
              : 'カードを裏返しています…'}
        </Button>
        {showResults && (
          <>
            <CopyResultButton
              text={readingText}
              label={mode === 'spread' ? '結果をコピー（AI 解説用）' : '結果をコピー'}
            />
            <Button variant="ghost" onClick={() => { setPhase('idle'); setDrawn([]); }}>
              結果を閉じる
            </Button>
          </>
        )}
      </div>

      {showBoard && mode === 'pair' && (
        <section class={styles.board} aria-live="polite">
          {drawn.map((d, i) => (
            <div class={styles.slot} key={`${d.card.id}-${i}`}>
              <span class={styles.slotLabel}>{SIDE_LABELS[d.side]}</span>
              <CardSlot
                card={d.card}
                orientation={d.orientation}
                revealed={true}
                positionLabel=""
                delayMs={i * 300}
              />
            </div>
          ))}
        </section>
      )}

      {showBoard && mode === 'spread' && (
        <section class={`${styles.board} ${styles.boardSpread}`} aria-live="polite">
          {(['you', 'partner'] as const).map((side) => {
            const sideCards = drawn.filter((d) => d.side === side);
            return (
              <div class={styles.spreadGroup} key={side}>
                <h2 class={styles.spreadGroupTitle}>{SIDE_LABELS[side]}</h2>
                <div class={styles.spreadRow}>
                  {sideCards.map((d, i) => (
                    <div class={styles.slot} key={`${d.card.id}-${d.position}`}>
                      <span class={styles.slotLabel}>{POSITION_LABELS[d.position]}</span>
                      <CardSlot
                        card={d.card}
                        orientation={d.orientation}
                        revealed={true}
                        positionLabel=""
                        delayMs={(side === 'partner' ? 3 : 0) * 300 + i * 300}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {showResults && mode === 'pair' && (() => {
        const summary = summarize(drawn[0], drawn[1]);
        return (
          <section class={styles.results}>
            <div class={styles.summary}>
              <h2 class={styles.summaryTitle}>二人の関係性</h2>
              <div class={styles.summaryGrid}>
                <div class={styles.summaryItem}>
                  <h4>共通テーマ</h4>
                  <p>{summary.commonTheme}</p>
                </div>
                <div class={styles.summaryItem}>
                  <h4>補完関係</h4>
                  <p>{summary.complement}</p>
                </div>
                <div class={`${styles.summaryItem} ${styles.contrast}`}>
                  <h4>緊張点</h4>
                  <p>{summary.tension}</p>
                </div>
              </div>
            </div>

            {drawn.map((d) => {
              const txt = interpret(d.card, d.orientation, d.position);
              return (
                <ResultPanel
                  key={`r-${d.card.id}-${d.side}`}
                  title={`${SIDE_LABELS[d.side]}のカード`}
                  subtitle={`${d.card.nameJp} · ${orientationLabel(d.orientation)}`}
                  keywords={txt.keywords}
                  tone={d.side === 'you' ? 'rose' : 'purple'}
                >
                  {txt.body}
                </ResultPanel>
              );
            })}
          </section>
        );
      })()}

      {showResults && mode === 'spread' && (
        <section class={styles.results}>
          <div class={styles.aiHint}>
            <h2 class={styles.aiHintTitle}>組み合わせ解説について</h2>
            <p>
              3 枚 × 3 枚の組み合わせは膨大なため、このサイトでは個々のカードの意味のみ表示しています。
              「結果をコピー（AI 解説用）」でテキストをコピーし、ChatGPT・Claude・Gemini などの生成 AI に貼り付けて、二人の関係性の読み解きを依頼してください。
            </p>
            <p class={styles.aiHintPrompt}>
              <strong>コピーに含まれる依頼文の例：</strong>
              {AI_PROMPT_HINT}
            </p>
          </div>

          {(['you', 'partner'] as const).map((side) => (
            <div class={styles.spreadResults} key={side}>
              <h2 class={styles.spreadResultsTitle}>{SIDE_LABELS[side]}のスプレッド</h2>
              {drawn
                .filter((d) => d.side === side)
                .map((d) => {
                  const txt = interpret(d.card, d.orientation, d.position);
                  return (
                    <ResultPanel
                      key={`r-${d.card.id}-${d.position}`}
                      title={`${POSITION_LABELS[d.position]}のカード`}
                      subtitle={`${d.card.nameJp} · ${orientationLabel(d.orientation)}`}
                      keywords={txt.keywords}
                      tone={side === 'you' ? 'rose' : 'purple'}
                    >
                      {txt.body}
                    </ResultPanel>
                  );
                })}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
