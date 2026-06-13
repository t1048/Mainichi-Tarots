import { useEffect, useMemo, useState } from 'preact/hooks';
import { Button } from './Button';
import { CardSlot } from './CardSlot';
import { ResultPanel } from './ResultPanel';
import { findCard, orientationLabel } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { drawTarotCard, drawTarotOrientation } from '../lib/tarot-draw';
import {
  buildTarotSummary,
  newHistoryId,
  saveHistoryEntry,
  type TarotHistoryDetail,
} from '../lib/history';
import { loadTodayDaily, saveTodayDaily, type DailyTarot } from '../lib/daily-fortune';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './DailyTarotDashboard.module.css';

type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';

export function DailyTarotDashboard() {
  const initial = loadTodayDaily<DailyTarot>('tarot');
  const [phase, setPhase] = useState<Phase>(initial ? 'done' : 'idle');
  const [drawn, setDrawn] = useState<DailyTarot | null>(initial);

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
      const t = setTimeout(() => setPhase('revealing'), 600);
      return () => clearTimeout(t);
    }
    if (phase === 'revealing') {
      const t = setTimeout(() => setPhase('done'), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'done' || !drawn) return;
    saveReading(drawn);
  }, [phase, drawn, saveReading]);

  const startReading = () => {
    if (phase === 'shuffling' || phase === 'revealing') return;
    resetSave();
    setDrawn(null);
    setPhase('shuffling');
    const next: DailyTarot = {
      cardId: drawTarotCard().id,
      orientation: drawTarotOrientation(),
    };
    setTimeout(() => setDrawn(next), 350);
    saveTodayDaily<DailyTarot>('tarot', next);
  };

  const interpretation = useMemo(() => {
    if (!card || !drawn || phase !== 'done') return null;
    return interpret(card, drawn.orientation, 'today');
  }, [card, drawn, phase]);

  const revealed = phase === 'revealing' || phase === 'done';

  return (
    <section class={styles.dashboard} aria-label="今日のワンオラクル">
      <header class={styles.head}>
        <h2 class={styles.title}>今日のワンオラクル</h2>
        <p class={styles.lede}>ホームからそのまま、今日のタロットを 1 枚引けます。</p>
      </header>

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

      <div class={styles.actions}>
        <Button
          onClick={startReading}
          size="lg"
          loading={phase === 'shuffling'}
          disabled={phase === 'revealing'}
        >
          {phase === 'idle'
            ? '今日の運勢を占う'
            : phase === 'shuffling'
              ? 'シャッフル中…'
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
