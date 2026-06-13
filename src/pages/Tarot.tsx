import { useEffect, useState, useCallback, useMemo, useRef } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ALL_CARDS, findCard, type TarotCard, type Orientation, type Position } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { secureRandomInt, chance, shuffle } from '../lib/rng';
import { saveHistoryEntry, type TarotHistoryDetail, buildTarotSummary } from '../lib/history';
import { loadTodayDaily, saveTodayDaily, type DailyTarot } from '../lib/daily-fortune';
import styles from './Tarot.module.css';

type Mode = 'one' | 'three';
type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';

interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position?: Position;
}

const POSITION_LABELS: Record<NonNullable<Position>, string> = {
  past: '過去',
  present: '現在',
  future: '未来',
  today: '今日',
};

const POSITIONS_3: NonNullable<Position>[] = ['past', 'present', 'future'];

function drawCard(): TarotCard {
  return ALL_CARDS[secureRandomInt(ALL_CARDS.length)];
}

function drawOrientation(): Orientation {
  return chance(0.5) ? 'upright' : 'reversed';
}

function newReadingId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function formatTarotReading(mode: Mode, cards: DrawnCard[]): string {
  const header = mode === 'one' ? '1 枚引き' : '3 枚スプレッド';
  const lines = ['【タロット占い】', header, ''];
  for (const d of cards) {
    const pos = d.position ?? 'today';
    const txt = interpret(d.card, d.orientation, pos);
    const orient = d.orientation === 'upright' ? '正位置' : '逆位置';
    lines.push(`■ ${POSITION_LABELS[pos]} — ${d.card.nameJp}（${orient}）`);
    if (txt.keywords.length > 0) {
      lines.push(`キーワード: ${txt.keywords.join(' / ')}`);
    }
    lines.push(txt.body);
    lines.push('');
  }
  lines.push('— 毎日タロット＆占い');
  return lines.join('\n');
}

export function Tarot() {
  const [mode, setMode] = useState<Mode>('one');
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (mode !== 'one') return;
    if (phase !== 'idle') return;
    if (drawn.length > 0) return;
    const stored = loadTodayDaily<DailyTarot>('tarot');
    if (!stored) return;
    const card = findCard(stored.cardId);
    if (!card) return;
    setDrawn([{ card, orientation: stored.orientation, position: 'today' }]);
    setPhase('done');
  }, [mode]);

  useEffect(() => {
    if (phase === 'shuffling') {
      const t = setTimeout(() => setPhase('revealing'), 600);
      return () => clearTimeout(t);
    }
    if (phase === 'revealing') {
      const t = setTimeout(() => {
        setPhase('done');
        if (drawn.length === 0) return;
        saveCurrent(drawn, mode);
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
  }, [phase, drawn, mode]);

  const saveCurrent = useCallback(
    (cards: DrawnCard[], m: Mode) => {
      if (cards.length === 0) return;
      if (savedRef.current) return;
      savedRef.current = true;
      const interpretation = cards
        .map((c) => {
          const txt = interpret(c.card, c.orientation, c.position ?? 'today');
          return `[${c.position ? POSITION_LABELS[c.position] : '今日'}] ${c.card.nameJp} — ${txt.body}`;
        })
        .join('\n\n');
      const detail: TarotHistoryDetail = {
        kind: 'tarot',
        mode: m,
        drawn: cards.map((c) => ({ card: c.card, orientation: c.orientation, position: c.position ?? 'today' })),
        interpretation,
      };
      saveHistoryEntry({
        id: newReadingId(),
        kind: 'tarot',
        date: new Date().toISOString(),
        summary: buildTarotSummary(cards.map((c) => ({ card: c.card, orientation: c.orientation, position: c.position ?? 'today' }))),
        detail,
      });
    },
    [],
  );

  const performDraw = useCallback(() => {
    setConfirmOpen(false);
    savedRef.current = false;
    setDrawn([]);
    setPhase('shuffling');
    const cards: DrawnCard[] = [];
    if (mode === 'one') {
      cards.push({ card: drawCard(), orientation: drawOrientation(), position: 'today' });
    } else {
      const shuffled = shuffle(ALL_CARDS);
      for (let i = 0; i < 3; i++) {
        cards.push({
          card: shuffled[i],
          orientation: drawOrientation(),
          position: POSITIONS_3[i],
        });
      }
    }
    setTimeout(() => setDrawn(cards), 350);
  }, [mode]);

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
            <CopyResultButton text={readingText} />
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
                subtitle={`${d.card.nameJp} · ${d.orientation === 'upright' ? '正位置' : '逆位置'}`}
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
              今日は「{dailyDrawn.card.nameJp}（{dailyDrawn.orientation === 'upright' ? '正位置' : '逆位置'}）」を引いています。
            </p>
          }
        />
      )}
    </article>
  );
}
