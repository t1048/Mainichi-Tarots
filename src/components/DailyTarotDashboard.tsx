import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from './Button';
import { CardSlot } from './CardSlot';
import { ResultPanel } from './ResultPanel';
import { TarotShuffleStage } from './TarotShuffleStage';
import { findCard, orientationLabel } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { drawTarotOrientation } from '../lib/tarot-draw';
import {
  drawFromTarotDeck,
  shuffleTarotDeck,
  tarotDeckRemaining,
} from '../lib/tarot-deck';
import {
  buildTarotSummary,
  newHistoryId,
  saveHistoryEntry,
  type TarotHistoryDetail,
} from '../lib/history';
import { loadTodayDaily, saveTodayDaily, type DailyTarot } from '../lib/daily-fortune';
import { getShuffleStyleOption, shuffleStyleDurationMs, useShuffleStyle } from '../lib/tarot-shuffle';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './DailyTarotDashboard.module.css';

type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';

export function DailyTarotDashboard() {
  const initial = loadTodayDaily<DailyTarot>('tarot');
  const [phase, setPhase] = useState<Phase>(initial ? 'done' : 'idle');
  const [drawn, setDrawn] = useState<DailyTarot | null>(initial);
  const [deckRemaining, setDeckRemaining] = useState(tarotDeckRemaining);
  const [shuffleStyle, setShuffleStyle] = useShuffleStyle();
  const shuffleOption = getShuffleStyleOption(shuffleStyle);
  const isInitialFromStorage = useRef(!!initial);

  const card = drawn ? findCard(drawn.cardId) : undefined;

  const { save: saveReading, reset: resetSave } = useSaveOnce<DailyTarot>((daily) => {
    const resolvedCard = findCard(daily.cardId);
    if (!resolvedCard) return;
    const txt = interpret(resolvedCard, daily.orientation, 'today');
    const detail: TarotHistoryDetail = {
      kind: 'tarot',
      mode: 'one',
      drawn: [{ card: resolvedCard, orientation: daily.orientation, position: 'today' }],
      interpretation: `[今日] ${resolvedCard.nameJp} — ${txt.body}`,
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'tarot',
      date: new Date().toISOString(),
      summary: buildTarotSummary(detail.drawn),
      detail,
    });
  });

  useEffect(() => {
    if (phase === 'shuffling') {
      const t = setTimeout(() => setPhase('idle'), shuffleStyleDurationMs(shuffleStyle));
      return () => clearTimeout(t);
    }
    if (phase === 'revealing') {
      const t = setTimeout(() => setPhase('done'), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, shuffleStyle]);

  useEffect(() => {
    if (isInitialFromStorage.current) {
      isInitialFromStorage.current = false;
      return;
    }
    if (phase !== 'done' || !drawn) return;
    saveReading(drawn);
  }, [phase, drawn, saveReading]);

  const handleShuffle = useCallback(() => {
    if (phase === 'shuffling' || phase === 'revealing') return;
    setPhase('shuffling');
    const deck = shuffleTarotDeck(shuffleStyle);
    setDeckRemaining(deck.order.length);
  }, [phase, shuffleStyle]);

  const startReading = () => {
    if (phase === 'shuffling' || phase === 'revealing') return;
    resetSave();
    setDrawn(null);

    const { cards: picked, deck } = drawFromTarotDeck(1);
    setDeckRemaining(deck.order.length);

    const pickedCard = picked[0];
    if (!pickedCard) return;

    const next: DailyTarot = {
      cardId: pickedCard.id,
      orientation: drawTarotOrientation(),
    };
    setDrawn(next);
    saveTodayDaily<DailyTarot>('tarot', next);
    setPhase('revealing');
  };

  const interpretation = useMemo(() => {
    if (!card || !drawn || phase !== 'done') return null;
    return interpret(card, drawn.orientation, 'today');
  }, [card, drawn, phase]);

  const revealed = phase === 'revealing' || phase === 'done';
  const isShuffling = phase === 'shuffling';
  const showDeck = phase === 'idle' || isShuffling;
  const controlsDisabled = isShuffling || phase === 'revealing';

  return (
    <section class={styles.dashboard} aria-label="今日のワンオラクル">
      <header class={styles.head}>
        <h2 class={styles.title}>今日のワンオラクル</h2>
        <p class={styles.lede}>ホームからそのまま、今日のタロットを 1 枚引けます。</p>
      </header>

      <TarotShuffleStage
        remaining={deckRemaining}
        shuffling={isShuffling}
        style={shuffleStyle}
        onStyleChange={setShuffleStyle}
        controlsDisabled={controlsDisabled}
        controlsPosition="below"
        compact
        showDeck={showDeck}
      >
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
      </TarotShuffleStage>

      <div class={styles.actions}>
        <Button
          onClick={startReading}
          size="lg"
          disabled={controlsDisabled}
        >
          {phase === 'revealing'
            ? 'カードを裏返しています…'
            : phase === 'done'
              ? 'もう一度引く（今日の結果を更新）'
              : '今日の運勢を占う'}
        </Button>
        {phase === 'done' && (
          <a class={styles.detailLink} href="#/tarot">
            タロットページで詳しく見る
          </a>
        )}
      </div>

      {!showDeck && (
        <div class={styles.stage}>
          {card && drawn ? (
            <CardSlot
              card={card}
              orientation={drawn.orientation}
              revealed={revealed}
              positionLabel="今日"
            />
          ) : (
            <div class={styles.placeholder} aria-hidden="true">
              <span class={styles.placeholderMark}>☽</span>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && card && drawn && interpretation && (
        <ResultPanel
          title="今日のあなたへのメッセージ"
          subtitle={`${card.nameJp} · ${orientationLabel(drawn.orientation)}`}
          keywords={interpretation.keywords}
          tone="gold"
        >
          {interpretation.body}
        </ResultPanel>
      )}
    </section>
  );
}
