import { useEffect, useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { TarotShuffleStage } from '../components/TarotShuffleStage';
import {
  ALL_CARDS,
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
import { summarizeLoveTarotPair } from '../lib/love-tarot-summary';
import { shufflePageEffectClass } from '../lib/shuffle-page-effect';
import { getShuffleStyleOption, shuffleStyleDurationMs, useShuffleStyle } from '../lib/tarot-shuffle';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './LoveTarot.module.css';

type Phase = 'idle' | 'deck-shuffling' | 'revealing' | 'done';
type LoveSide = 'you' | 'partner';

const FULL_DECK_COUNT = ALL_CARDS.length;

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

const AI_PROMPT_HINT_PAIR =
  '上記のタロット相性占い（1 枚 × 1 枚）の結果を、共通テーマ・補完関係・緊張点を踏まえて、二人の関係性の観点から読み解いてください。';

const AI_PROMPT_HINT_SPREAD =
  '上記のタロット相性占いの結果を、二人の関係性（過去の経緯・今の関係・これからの展開）の観点から統合的に読み解いてください。';

function toTarotDrawn(cards: DrawnCard[]): TarotDrawn[] {
  return cards.map((d) => ({
    card: d.card,
    orientation: d.orientation,
    position: d.position,
  }));
}

function formatPairReading(drawn: DrawnCard[]): string {
  const summary = summarizeLoveTarotPair(drawn[0], drawn[1]);
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
  lines.push('—');
  lines.push('以下の文を生成 AI（ChatGPT・Claude・Gemini など）に貼り付けて、二人の関係性の解説を依頼できます。');
  lines.push(AI_PROMPT_HINT_PAIR);
  lines.push('');
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
  lines.push(AI_PROMPT_HINT_SPREAD);
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
  const [shuffleStyle, setShuffleStyle] = useShuffleStyle();
  const shuffleOption = getShuffleStyleOption(shuffleStyle);

  const { save: saveReading, reset: resetSave } = useSaveOnce<{ mode: LoveTarotMode; cards: DrawnCard[] }>(
    ({ mode: savedMode, cards }) => {
      if (savedMode === 'pair') {
        const [a, b] = cards;
        const summary = summarizeLoveTarotPair(a, b);
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

  useEffect(() => {
    if (phase === 'deck-shuffling') {
      const t = setTimeout(() => setPhase('idle'), shuffleStyleDurationMs(shuffleStyle));
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, shuffleStyle]);

  const handleModeSwitch = (next: LoveTarotMode) => {
    if (next === mode) return;
    setMode(next);
    setDrawn([]);
    setPhase('idle');
    resetSave();
  };

  const handleShuffle = useCallback(() => {
    if (phase === 'deck-shuffling' || phase === 'revealing') return;
    setPhase('deck-shuffling');
  }, [phase]);

  const handleShuffleDone = useCallback(() => {
    setPhase('idle');
  }, []);

  const startReading = useCallback(() => {
    if (phase !== 'idle' && phase !== 'done') return;
    resetSave();
    setDrawn([]);
    const cards = drawCards(mode);
    setDrawn(cards);
    setPhase('revealing');
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
  const showDeck = phase === 'idle' || phase === 'deck-shuffling';
  const isShuffling = phase === 'deck-shuffling';
  const pageEffect = shufflePageEffectClass(shuffleOption.pageEffect, isShuffling);

  return (
    <article class={`${styles.page} ${pageEffect}`}>
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
          disabled={phase === 'revealing' || isShuffling}
        >
          <span class={styles.tabMark}>Ⅱ</span>
          <span class={styles.tabText}>1 枚 × 1 枚</span>
        </button>
        <button
          role="tab"
          aria-selected={mode === 'spread'}
          class={`${styles.tab} ${mode === 'spread' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('spread')}
          disabled={phase === 'revealing' || isShuffling}
        >
          <span class={styles.tabMark}>Ⅵ</span>
          <span class={styles.tabText}>3 枚 × 3 枚（過去 / 現在 / 未来）</span>
        </button>
      </div>

      {showDeck && (
        <section aria-label="山札">
          <TarotShuffleStage
            remaining={FULL_DECK_COUNT}
            shuffling={isShuffling}
            style={shuffleStyle}
            onStyleChange={setShuffleStyle}
            onShuffleDone={handleShuffleDone}
            controlsDisabled={isShuffling}
            hint="シャッフルは演出です。好みの種類を選んでから、カードを引いてください。"
          />
        </section>
      )}

      <div class={styles.action}>
        {showDeck && (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleShuffle}
            loading={isShuffling}
          >
            {isShuffling ? `${shuffleOption.label}中…` : '山札をシャッフル'}
          </Button>
        )}
        <Button
          onClick={startReading}
          size="lg"
          disabled={phase === 'revealing' || isShuffling}
        >
          {phase === 'idle' || phase === 'deck-shuffling'
            ? mode === 'pair'
              ? '2 枚のカードを引く'
              : '6 枚のカードを引く'
            : phase === 'revealing'
              ? 'カードを裏返しています…'
              : mode === 'pair'
                ? '2 枚のカードを引く'
                : '6 枚のカードを引く'}
        </Button>
        {showResults && (
          <>
            <CopyResultButton
              text={readingText}
              label="結果をコピー（AI 解説用）"
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
        const summary = summarizeLoveTarotPair(drawn[0], drawn[1]);
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
              {AI_PROMPT_HINT_SPREAD}
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
