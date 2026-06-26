import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from './Button';
import { CardSlot } from './CardSlot';
import { ResultPanel } from './ResultPanel';
import { TarotShuffleStage } from './TarotShuffleStage';
import { ALL_CARDS, findCard, orientationLabel } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { drawTarotCard, drawTarotOrientation } from '../lib/tarot-draw';
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

const FULL_DECK_COUNT = ALL_CARDS.length;

export function DailyTarotDashboard() {
  const initial = loadTodayDaily<DailyTarot>('tarot');
  const [phase, setPhase] = useState<Phase>(initial ? 'done' : 'idle');
  const [drawn, setDrawn] = useState<DailyTarot | null>(initial);
  const [shuffleStyle, setShuffleStyle] = useShuffleStyle();
  const shuffleOption = getShuffleStyleOption(shuffleStyle);
  const isInitialFromStorage = useRef(!!initial);
  const pendingDraw = useRef<DailyTarot | null>(null);

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
      const t = setTimeout(() => {
        const next = pendingDraw.current;
        if (next) {
          setDrawn(next);
          pendingDraw.current = null;
        }
        setPhase('revealing');
      }, shuffleStyleDurationMs(shuffleStyle));
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

  const startReading = () => {
    if (phase === 'shuffling' || phase === 'revealing') return;
    resetSave();
    setDrawn(null);
    const next: DailyTarot = {
      cardId: drawTarotCard().id,
      orientation: drawTarotOrientation(),
    };
    pendingDraw.current = next;
    saveTodayDaily<DailyTarot>('tarot', next);
    setPhase('shuffling');
  };

  const handleShuffleDone = useCallback(() => {
    const next = pendingDraw.current;
    if (next) {
      setDrawn(next);
      pendingDraw.current = null;
    }
    setPhase('revealing');
  }, []);

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
        remaining={FULL_DECK_COUNT}
        shuffling={isShuffling}
        style={shuffleStyle}
        onStyleChange={setShuffleStyle}
        onShuffleDone={handleShuffleDone}
        controlsDisabled={controlsDisabled}
        compact
        showDeck={showDeck}
      />

      <div class={styles.stage}>
        {card && drawn && !showDeck ? (
          <CardSlot
            card={card}
            orientation={drawn.orientation}
            revealed={revealed}
            positionLabel="今日"
          />
        ) : showDeck ? null : (
          <div class={styles.placeholder} aria-hidden="true">
            <span class={styles.placeholderMark}>☽</span>
          </div>
        )}
      </div>

      <div class={styles.actions}>
        <Button
          onClick={startReading}
          size="lg"
          loading={isShuffling}
          disabled={phase === 'revealing'}
        >
          {phase === 'idle' || phase === 'done'
            ? '今日の運勢を占う'
            : isShuffling
              ? `${shuffleOption.label}中…`
              : phase === 'revealing'
                ? 'カードを裏返しています…'
                : 'もう一度引く（今日の結果を更新）'}
        </Button>
        {phase === 'done' && (
          <a class={styles.detailLink} href="#/tarot">
            タロットページで詳しく見る
          </a>
        )}
      </div>

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
