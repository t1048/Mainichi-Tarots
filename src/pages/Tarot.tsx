import { useEffect, useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { findCard, orientationLabel, POSITION_LABELS, type TarotCard, type Orientation, type Position } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { drawTarotCard, drawTarotOrientation, drawUniqueTarotCards } from '../lib/tarot-draw';
import { saveHistoryEntry, type TarotHistoryDetail, buildTarotSummary, newHistoryId } from '../lib/history';
import { saveTodayDaily, type DailyTarot } from '../lib/daily-fortune';
import { useDailyRestore } from '../lib/use-daily-restore';
import { useSaveOnce } from '../lib/use-save-once';
import styles from './Tarot.module.css';

type Mode = 'one' | 'three';
type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';

interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position?: Position;
}

const POSITIONS_3: NonNullable<Position>[] = ['past', 'present', 'future'];

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

export function Tarot() {
  const [mode, setMode] = useState<Mode>('one');
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useDailyRestore<DailyTarot, DrawnCard[]>('tarot', {
    enabled: mode === 'one' && phase === 'idle' && drawn.length === 0,
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
    if (phase === 'shuffling') {
      const t = setTimeout(() => setPhase('revealing'), 600);
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
  }, [phase, drawn, mode, saveReading]);

  const performDraw = useCallback(() => {
    setConfirmOpen(false);
    resetSave();
    setDrawn([]);
    setPhase('shuffling');
    const cards: DrawnCard[] = [];
    if (mode === 'one') {
      cards.push({ card: drawTarotCard(), orientation: drawTarotOrientation(), position: 'today' });
    } else {
      const picked = drawUniqueTarotCards(3);
      for (let i = 0; i < 3; i++) {
        cards.push({
          card: picked[i],
          orientation: drawTarotOrientation(),
          position: POSITIONS_3[i],
        });
      }
    }
    setTimeout(() => setDrawn(cards), 350);
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
    if (phase === 'shuffling' || phase === 'idle') return {};
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

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>タロット占い</h1>
        <p class={styles.lede}>
          78 枚のフルデッキ(大アルカナ 22 + 小アルカナ 56)。直感を信じて、カードを引いてみましょう。
        </p>
      </header>

      <div class={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'one'}
          class={`${styles.tab} ${mode === 'one' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('one')}
        >
          <span class={styles.tabMark}>Ⅰ</span>
          <span class={styles.tabText}>1 枚引き(今日のカード)</span>
        </button>
        <button
          role="tab"
          aria-selected={mode === 'three'}
          class={`${styles.tab} ${mode === 'three' ? styles.tabActive : ''}`}
          onClick={() => handleModeSwitch('three')}
        >
          <span class={styles.tabMark}>Ⅲ</span>
          <span class={styles.tabText}>3 枚スプレッド(過去 / 現在 / 未来)</span>
        </button>
      </div>

      <div class={styles.actionRow}>
        <Button
          onClick={startReading}
          size="lg"
          loading={phase === 'shuffling'}
          disabled={phase === 'revealing'}
        >
          {phase === 'idle' || phase === 'done'
            ? mode === 'one'
              ? dailyLoaded ? 'もう一度引く（確認あり）' : 'カードを 1 枚引く'
              : 'カードを 3 枚引く'
            : phase === 'shuffling' ? 'シャッフル中…' : 'カードを裏返しています…'}
        </Button>
        {phase === 'done' && drawn.length > 0 && (
          <>
            <CopyResultButton text={readingText} label="結果をコピー（AI 解説用）" />
            <Button variant="ghost" onClick={() => { setPhase('idle'); setDrawn([]); }}>
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
    </article>
  );
}
