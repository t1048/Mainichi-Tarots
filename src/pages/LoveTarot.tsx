import { useEffect, useState, useCallback, useRef } from 'preact/hooks';
import { Button } from '../components/Button';
import { CardSlot } from '../components/CardSlot';
import { ResultPanel } from '../components/ResultPanel';
import { ALL_CARDS, type TarotCard, type Orientation } from '../data/tarot-meta';
import { interpret } from '../data/templates';
import { chance, shuffle } from '../lib/rng';
import { saveHistoryEntry, type LoveTarotHistoryDetail, buildLoveTarotSummary, newHistoryId } from '../lib/history';
import styles from './LoveTarot.module.css';

type Phase = 'idle' | 'shuffling' | 'revealing' | 'done';
type LovePosition = 'you' | 'partner';

interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position: LovePosition;
}

const POSITION_LABELS: Record<LovePosition, string> = {
  you: 'あなた',
  partner: '相手',
};

function drawOrientation(): Orientation {
  return chance(0.5) ? 'upright' : 'reversed';
}

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

export function LoveTarot() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const savedRef = useRef(false);

  const startReading = useCallback(() => {
    if (phase === 'shuffling' || phase === 'revealing') return;
    savedRef.current = false;
    setDrawn([]);
    setPhase('shuffling');
    const shuffled = shuffle(ALL_CARDS);
    const cards: DrawnCard[] = [
      { card: shuffled[0], orientation: drawOrientation(), position: 'you' },
      { card: shuffled[1], orientation: drawOrientation(), position: 'partner' },
    ];
    setTimeout(() => {
      setDrawn(cards);
      setPhase('revealing');
    }, 700);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'revealing') return undefined;
    const t = setTimeout(() => {
      setPhase('done');
      if (drawn.length === 2 && !savedRef.current) {
        savedRef.current = true;
        const [a, b] = drawn;
        const summary = summarize(a, b);
        // Build TarotDrawn-shaped rows for history (use 'today' as a neutral position)
        const detail: LoveTarotHistoryDetail = {
          kind: 'love-tarot',
          you: { card: a.card, orientation: a.orientation, position: 'today' },
          partner: { card: b.card, orientation: b.orientation, position: 'today' },
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
      }
    }, 900);
    return () => clearTimeout(t);
  }, [phase, drawn]);

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>タロット相性占い</h1>
        <p class={styles.lede}>
          2 枚のカードを引いて、あなたと相手の関係性を読み解きます。
          共通テーマ・補完関係・緊張点の 3 つの視点で整理します。
        </p>
      </header>

      <div class={styles.action}>
        <Button
          onClick={startReading}
          size="lg"
          loading={phase === 'shuffling'}
          disabled={phase === 'revealing'}
        >
          {phase === 'idle' || phase === 'done'
            ? '2 枚のカードを引く'
            : phase === 'shuffling'
              ? 'シャッフル中…'
              : 'カードを裏返しています…'}
        </Button>
        {phase === 'done' && drawn.length === 2 && (
          <Button variant="ghost" onClick={() => { setPhase('idle'); setDrawn([]); }}>
            結果を閉じる
          </Button>
        )}
      </div>

      {(phase === 'revealing' || phase === 'done') && drawn.length === 2 && (
        <section class={styles.board} aria-live="polite">
          {drawn.map((d, i) => (
            <div class={styles.slot} key={`${d.card.id}-${i}`}>
              <span class={styles.slotLabel}>{POSITION_LABELS[d.position]}</span>
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

      {phase === 'done' && drawn.length === 2 && (() => {
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
              const txt = interpret(d.card, d.orientation, 'today');
              return (
                <ResultPanel
                  key={`r-${d.card.id}-${d.position}`}
                  title={`${POSITION_LABELS[d.position]}のカード`}
                  subtitle={`${d.card.nameJp} · ${d.orientation === 'upright' ? '正位置' : '逆位置'}`}
                  keywords={txt.keywords}
                  tone={d.position === 'you' ? 'rose' : 'purple'}
                >
                  {txt.body}
                </ResultPanel>
              );
            })}
          </section>
        );
      })()}
    </article>
  );
}
