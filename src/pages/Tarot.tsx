import { useEffect, useState, useCallback, useMemo } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { ResultPanel } from '../components/ResultPanel';
import { ALL_CARDS } from '../data/tarot-meta';
import type { TarotCard, Orientation, Position } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { secureRandomInt, chance, shuffle } from '../lib/rng';
import { loadJSON, saveJSON, dateKey } from '../lib/storage';
import { formatDateJP, formatTimeJP } from '../lib/format';
import styles from './Tarot.module.css';

type Mode = 'one' | 'three';
type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';

interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position?: Position;
}

interface HistoryEntry {
  id: string;
  date: string;
  mode: Mode;
  drawn: DrawnCard[];
  interpretation: string;
}

const HISTORY_KEY = 'tarot-history';

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

export function Tarot() {
  const [mode, setMode] = useState<Mode>('one');
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadJSON<HistoryEntry[]>(HISTORY_KEY, []));
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('r')) {
      const decoded = tryDecodePreset(params.get('r') ?? '');
      if (decoded) {
        setMode(decoded.mode);
        setDrawn(decoded.drawn);
        setPhase('done');
      }
    }
  }, []);

  useEffect(() => {
    if (phase === 'shuffling') {
      const t = setTimeout(() => setPhase('revealing'), 600);
      return () => clearTimeout(t);
    }
    if (phase === 'revealing') {
      const t = setTimeout(() => {
        setPhase('done');
        saveCurrent(drawn, mode);
      }, mode === 'one' ? 700 : 1700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, drawn, mode]);

  const saveCurrent = useCallback(
    (cards: DrawnCard[], m: Mode) => {
      if (cards.length === 0) return;
      const entry: HistoryEntry = {
        id: newReadingId(),
        date: new Date().toISOString(),
        mode: m,
        drawn: cards,
        interpretation: cards
          .map((c) => {
            const txt = interpret(c.card, c.orientation, c.position ?? 'today');
            return `[${c.position ? POSITION_LABELS[c.position] : '今日'}] ${c.card.nameJp} — ${txt.body}`;
          })
          .join('\n\n'),
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 30);
        saveJSON(HISTORY_KEY, next);
        return next;
      });
    },
    [],
  );

  const startReading = useCallback(() => {
    if (phase !== 'idle' && phase !== 'done') return;
    setShowHistory(false);
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
    // small delay so the user sees the shuffle animation before reveal
    setTimeout(() => setDrawn(cards), 350);
  }, [mode, phase]);

  const revealState: Record<number, boolean> = useMemo(() => {
    if (phase === 'shuffling' || phase === 'idle') return {};
    if (phase === 'revealing') {
      return drawn.reduce<Record<number, boolean>>((acc, _, i) => {
        acc[i] = true;
        return acc;
      }, {});
    }
    return drawn.reduce<Record<number, boolean>>((acc, _, i) => {
      acc[i] = true;
      return acc;
    }, {});
  }, [phase, drawn]);

  const todays = history.find((h) => h.date.startsWith(dateKey()));

  const handleModeSwitch = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setDrawn([]);
    setPhase('idle');
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveJSON(HISTORY_KEY, []);
  };

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>タロット占い</h1>
        <p class={styles.lede}>
          78 枚のフルデッキ(大アルカナ 22 + 小アルカナ 56)。直感を信じて、カードを引いてみましょう。
        </p>
        {todays && !showHistory && (
          <div class={styles.todayHint}>
            <span>本日の結果はもう記録されています</span>
            <button class={styles.linkBtn} onClick={() => setShowHistory(true)}>
              履歴を見る
            </button>
          </div>
        )}
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
            ? mode === 'one' ? 'カードを 1 枚引く' : 'カードを 3 枚引く'
            : phase === 'shuffling' ? 'シャッフル中…' : 'カードを裏返しています…'}
        </Button>
        {phase === 'done' && drawn.length > 0 && (
          <Button variant="ghost" onClick={() => { setPhase('idle'); setDrawn([]); }}>
            結果を閉じる
          </Button>
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

      <section class={styles.historySection}>
        <div class={styles.historyHead}>
          <h2>履歴</h2>
          <div class={styles.historyActions}>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? '閉じる' : '履歴を見る'}
            </Button>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                全削除
              </Button>
            )}
          </div>
        </div>
        {showHistory && (
          <ul class={styles.historyList}>
            {history.length === 0 && (
              <li class={styles.historyEmpty}>まだ履歴がありません。</li>
            )}
            {history.map((h) => {
              const d = new Date(h.date);
              return (
                <li key={h.id} class={styles.historyItem}>
                  <div class={styles.historyMeta}>
                    <span>{formatDateJP(d)}</span>
                    <span class={styles.faint}>{formatTimeJP(d)}</span>
                    <span class={styles.tag}>{h.mode === 'one' ? '1枚' : '3枚'}</span>
                  </div>
                  <div class={styles.historyBody}>
                    {h.drawn.map((c) => (
                      <span key={c.card.id + c.position} class={styles.historyCard}>
                        <strong>{c.card.nameJp}</strong>
                        <small>{c.orientation === 'upright' ? '正' : '逆'}</small>
                      </span>
                    ))}
                  </div>
                  <details>
                    <summary class={styles.summary}>解釈を開く</summary>
                    <p class={styles.historyText}>{h.interpretation}</p>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}

function tryDecodePreset(raw: string): { mode: Mode; drawn: DrawnCard[] } | null {
  try {
    const decoded = JSON.parse(atob(raw)) as {
      mode: Mode;
      ids: Array<[string, Orientation, Position]>;
    };
    if (decoded.mode !== 'one' && decoded.mode !== 'three') return null;
    const drawn: DrawnCard[] = [];
    for (const [id, o, p] of decoded.ids) {
      const c = ALL_CARDS.find((x) => x.id === id);
      if (!c) return null;
      drawn.push({ card: c, orientation: o, position: p });
    }
    if (drawn.length === 0) return null;
    return { mode: decoded.mode, drawn };
  } catch {
    return null;
  }
}
