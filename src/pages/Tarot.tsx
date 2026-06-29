import { useEffect, useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TarotCard } from '../components/TarotCard';
import { TarotShuffleStage } from '../components/TarotShuffleStage';
import {
  ALL_CARDS,
  findCard,
  orientationLabel,
  POSITION_LABELS,
  SUIT_LABELS,
  SUIT_ORDER,
  type TarotCard as TarotCardType,
  type Orientation,
  type Position,
} from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { drawTarotOrientation } from '../lib/tarot-draw';
import {
  drawFromTarotDeck,
  shuffleTarotDeck,
  tarotDeckRemaining,
} from '../lib/tarot-deck';
import { saveHistoryEntry, type TarotHistoryDetail, buildTarotSummary, newHistoryId } from '../lib/history';
import { saveTodayDaily, type DailyTarot } from '../lib/daily-fortune';
import { useDailyRestore } from '../lib/use-daily-restore';
import { useSaveOnce } from '../lib/use-save-once';
import { getShuffleStyleOption, shuffleStyleDurationMs, useShuffleStyle } from '../lib/tarot-shuffle';
import { shufflePageEffectClass } from '../lib/shuffle-page-effect';
import styles from './Tarot.module.css';

type Mode = 'one' | 'three';
type Phase = 'idle' | 'deck-shuffling' | 'revealing' | 'done';

const POSITIONS_3: NonNullable<Position>[] = ['past', 'present', 'future'];

interface DrawnCard {
  card: TarotCardType;
  orientation: Orientation;
  position?: Position;
}

const AI_PROMPT_HINT =
  '上記のタロット占いの結果（カード名・正逆・位置）を、総合的なメッセージとして読み解いてください。';

function formatTarotReading(mode: Mode, cards: DrawnCard[]): string {
  const header = mode === 'one' ? '1 枚引き' : '3 枚スプレッド';
  const lines = ['【タロット占い】', header, ''];
  for (const d of cards) {
    const pos = d.position ?? 'today';
    const txt = interpret(d.card, d.orientation, pos);
    lines.push(`■ ${POSITION_LABELS[pos]} — ${d.card.nameJp}（${orientationLabel(d.orientation)}）`);
    if (txt.keywords.length > 0) {
      lines.push(`キーワード: ${txt.keywords.join(' / ')}`);
    }
    lines.push(txt.body);
    lines.push('');
  }
  lines.push('—');
  lines.push('以下の文を生成 AI（ChatGPT・Claude・Gemini など）に貼り付けて、占いの結果を統合的に読み解いてもらえます。');
  lines.push(AI_PROMPT_HINT);
  lines.push('');
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

function drawnToDetailRows(cards: DrawnCard[]): TarotHistoryDetail['drawn'] {
  return cards.map((c) => ({
    card: c.card,
    orientation: c.orientation,
    position: c.position ?? 'today',
  }));
}

function buildInterpretation(cards: DrawnCard[]): string {
  return cards
    .map((c) => {
      const txt = interpret(c.card, c.orientation, c.position ?? 'today');
      return `[${c.position ? POSITION_LABELS[c.position] : '今日'}] ${c.card.nameJp} — ${txt.body}`;
    })
    .join('\n\n');
}

function tarotDrawIntentFromHash(): boolean {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex < 0) return false;
  return new URLSearchParams(hash.slice(qIndex + 1)).get('draw') === '1';
}

function TarotGalleryItem({ card }: { card: TarotCardType }) {
  const [orientation, setOrientation] = useState<Orientation>('upright');
  const tone = orientation === 'upright' ? card.upright : card.reversed;
  const toggleOrientation = () => {
    setOrientation((o) => (o === 'upright' ? 'reversed' : 'upright'));
  };

  return (
    <li class={styles.galleryItem}>
      <button
        type="button"
        class={styles.galleryCardBtn}
        onClick={toggleOrientation}
        aria-label={`${card.nameJp}の${orientationLabel(orientation)}。タップで正逆を切り替え`}
      >
        <TarotCard card={card} orientation={orientation} size="sm" />
      </button>
      <div class={styles.galleryBody}>
        <strong>{card.nameJp}</strong>
        {card.nameEn && <small class={styles.muted}>{card.nameEn}</small>}
        <span class={styles.orient}>
          {orientationLabel(orientation)}
          <span class={styles.orientHint}> · カードをタップで切り替え</span>
        </span>
        <div class={styles.keywords}>
          {tone.keywords.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
        <p class={styles.summary}>{tone.summary}</p>
      </div>
    </li>
  );
}

export function Tarot() {
  const [mode, setMode] = useState<Mode>('one');
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deckRemaining, setDeckRemaining] = useState(tarotDeckRemaining);
  const [dailyRestoreSkipped, setDailyRestoreSkipped] = useState(tarotDrawIntentFromHash);
  const [shuffleStyle, setShuffleStyle] = useShuffleStyle();
  const shuffleOption = getShuffleStyleOption(shuffleStyle);

  useDailyRestore<DailyTarot, DrawnCard[]>('tarot', {
    enabled: mode === 'one' && phase === 'idle' && drawn.length === 0 && !dailyRestoreSkipped,
    deps: [mode],
    resolve: (stored) => {
      const card = findCard(stored.cardId);
      if (!card) return null;
      return [{ card, orientation: stored.orientation, position: 'today' }];
    },
    apply: (cards) => {
      setDrawn(cards);
      setPhase('done');
    },
  });

  useEffect(() => {
    if (!tarotDrawIntentFromHash()) return;
    history.replaceState(null, '', '#/tarot');
  }, []);

  const { save: saveReading, reset: resetSave } = useSaveOnce<DrawnCard[]>((cards) => {
    const detail: TarotHistoryDetail = {
      kind: 'tarot',
      mode,
      drawn: drawnToDetailRows(cards),
      interpretation: buildInterpretation(cards),
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'tarot',
      date: new Date().toISOString(),
      summary: buildTarotSummary(drawnToDetailRows(cards)),
      detail,
    });
  });

  useEffect(() => {
    if (phase === 'deck-shuffling') {
      const t = setTimeout(() => setPhase('idle'), shuffleStyleDurationMs(shuffleStyle));
      return () => clearTimeout(t);
    }
    if (phase === 'revealing') {
      const t = setTimeout(() => {
        setPhase('done');
        if (drawn.length === 0) return;
        saveReading(drawn);
        if (mode === 'one' && drawn.length === 1) {
          const d = drawn[0];
          saveTodayDaily<DailyTarot>('tarot', {
            cardId: d.card.id,
            orientation: d.orientation,
          });
        }
      }, mode === 'one' ? 700 : 1700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, drawn, mode, saveReading, shuffleStyle]);

  const handleShuffle = useCallback(() => {
    if (phase === 'deck-shuffling' || phase === 'revealing') return;
    setPhase('deck-shuffling');
    const deck = shuffleTarotDeck(shuffleStyle);
    setDeckRemaining(deck.order.length);
  }, [phase, shuffleStyle]);

  const performDraw = useCallback(() => {
    setConfirmOpen(false);
    resetSave();
    setDrawn([]);

    const count = mode === 'one' ? 1 : 3;
    const { cards: picked, deck } = drawFromTarotDeck(count);
    setDeckRemaining(deck.order.length);

    const cards: DrawnCard[] = [];
    if (mode === 'one' && picked[0]) {
      cards.push({ card: picked[0], orientation: drawTarotOrientation(), position: 'today' });
    } else {
      for (let i = 0; i < picked.length; i++) {
        cards.push({
          card: picked[i],
          orientation: drawTarotOrientation(),
          position: POSITIONS_3[i],
        });
      }
    }

    setDrawn(cards);
    setPhase('revealing');
  }, [mode, resetSave]);

  const startReading = useCallback(() => {
    if (phase !== 'idle' && phase !== 'done') return;
    if (mode === 'one' && phase === 'done' && drawn.length === 1) {
      setConfirmOpen(true);
      return;
    }
    performDraw();
  }, [mode, phase, drawn, performDraw]);

  const handleModeSwitch = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setDrawn([]);
    setPhase('idle');
    setConfirmOpen(false);
  };

  const revealState: Record<number, boolean> = useMemo(() => {
    if (phase === 'idle' || phase === 'deck-shuffling') return {};
    return drawn.reduce<Record<number, boolean>>((acc, _, i) => {
      acc[i] = true;
      return acc;
    }, {});
  }, [phase, drawn]);

  const readingText = useMemo(
    () => (phase === 'done' && drawn.length > 0 ? formatTarotReading(mode, drawn) : ''),
    [phase, drawn, mode],
  );

  const dailyLoaded = mode === 'one' && phase === 'done' && drawn.length === 1;
  const dailyDrawn = dailyLoaded ? drawn[0] : null;
  const showDeck = phase === 'idle' || phase === 'deck-shuffling';
  const isShuffling = phase === 'deck-shuffling';
  const pageEffect = shufflePageEffectClass(shuffleOption.pageEffect, isShuffling);

  return (
    <article class={`${styles.page} ${pageEffect}`}>
      <header class={styles.hero}>
        <h1>タロット占い</h1>
        <p class={styles.lede}>
          78 枚のフルデッキ(大アルカナ 22 + 小アルカナ 56)。山札をシャッフルしてから、直感を信じてカードを引いてみましょう。
        </p>
      </header>

      <div class={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'one'}
          class={`${styles.tab} ${mode === 'one' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('one')}
          disabled={phase === 'revealing' || isShuffling}
        >
          <span class={styles.tabMark}>Ⅰ</span>
          <span class={styles.tabText}>1 枚引き(今日のカード)</span>
        </button>
        <button
          role="tab"
          aria-selected={mode === 'three'}
          class={`${styles.tab} ${mode === 'three' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('three')}
          disabled={phase === 'revealing' || isShuffling}
        >
          <span class={styles.tabMark}>Ⅲ</span>
          <span class={styles.tabText}>3 枚スプレッド(過去 / 現在 / 未来)</span>
        </button>
      </div>

      {showDeck && (
        <section aria-label="山札">
          <TarotShuffleStage
            remaining={deckRemaining}
            shuffling={isShuffling}
            style={shuffleStyle}
            onStyleChange={setShuffleStyle}
            controlsDisabled={isShuffling}
            hint="シャッフルは何度でもできます。引かずに他のページへ移動しても、山札の順番は保持されます。"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={handleShuffle}
              loading={isShuffling}
            >
              {isShuffling ? `${shuffleOption.label}中…` : '山札をシャッフル'}
            </Button>
          </TarotShuffleStage>
        </section>
      )}

      <div class={styles.actionRow}>
        <Button
          onClick={startReading}
          size="lg"
          disabled={phase === 'revealing' || isShuffling}
        >
          {phase === 'idle' || phase === 'deck-shuffling'
            ? mode === 'one'
              ? 'カードを 1 枚引く'
              : 'カードを 3 枚引く'
            : phase === 'revealing'
              ? 'カードを裏返しています…'
              : mode === 'one'
                ? dailyLoaded
                  ? 'もう一度引く（確認あり）'
                  : 'カードを 1 枚引く'
                : 'カードを 3 枚引く'}
        </Button>
        {phase === 'done' && drawn.length > 0 && (
          <>
            <CopyResultButton text={readingText} label="結果をコピー（AI 解説用）" />
            <Button
              variant="ghost"
              onClick={() => {
                setDailyRestoreSkipped(true);
                setPhase('idle');
                setDrawn([]);
              }}
            >
              結果を閉じる
            </Button>
          </>
        )}
      </div>

      {drawn.length > 0 && (
        <section class={`${styles.board} ${mode === 'three' ? styles.boardThree : ''}`} aria-live="polite">
          {drawn.map((d, i) => (
            <CardSlot
              key={d.card.id + i}
              card={d.card}
              orientation={d.orientation}
              revealed={!!revealState[i]}
              positionLabel={d.position ? POSITION_LABELS[d.position] : '今日'}
              delayMs={i * 400}
            />
          ))}
        </section>
      )}

      {phase === 'done' && drawn.length > 0 && (
        <section class={styles.results}>
          {drawn.map((d, i) => {
            const txt = interpret(d.card, d.orientation, d.position ?? 'today');
            const heading = d.position
              ? `${POSITION_LABELS[d.position]}のカード`
              : '今日のあなたへのメッセージ';
            return (
              <ResultPanel
                key={`r-${d.card.id}-${i}`}
                title={heading}
                subtitle={`${d.card.nameJp} · ${orientationLabel(d.orientation)}`}
                keywords={txt.keywords}
              >
                {txt.body}
              </ResultPanel>
            );
          })}
        </section>
      )}

      {confirmOpen && dailyDrawn && (
        <ConfirmDialog
          title="もう一度引きますか?"
          tone="gold"
          confirmLabel="もう一度引く"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={performDraw}
          body={
            <p>
              今日は「{dailyDrawn.card.nameJp}（{orientationLabel(dailyDrawn.orientation)}）」を引いています。
            </p>
          }
        />
      )}

      <section class={styles.gallery}>
        <h2>タロット一覧</h2>
        <p class={styles.muted}>78 枚すべての意味を一覧で確認できます。カードをタップすると正位置と逆位置の解説を切り替えられます。</p>

        <div class={styles.galleryGroup}>
          <h3 class={styles.galleryHeading}>大アルカナ</h3>
          <ul class={styles.galleryList}>
            {ALL_CARDS.filter((c) => c.arcana === 'major').map((card) => (
              <TarotGalleryItem key={card.id} card={card} />
            ))}
          </ul>
        </div>

        {SUIT_ORDER.map((suit) => (
          <div class={styles.galleryGroup} key={suit}>
            <h3 class={styles.galleryHeading}>{SUIT_LABELS[suit].name}</h3>
            <ul class={styles.galleryList}>
              {ALL_CARDS.filter((c) => c.suit === suit).map((card) => (
                <TarotGalleryItem key={card.id} card={card} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}
