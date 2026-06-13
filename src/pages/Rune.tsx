import { useState, useCallback, useRef } from 'preact/hooks';
import { Button } from '../components/Button';
import { ResultPanel } from '../components/ResultPanel';
import { RuneStone } from '../components/RuneStone';
import { RUNES, type RuneResult, type RunePosition, interpretRune, RUNE_POSITION_LABEL } from '../data/rune-meta';
import { secureRandomInt, chance } from '../lib/rng';
import { saveHistoryEntry, type RuneHistoryDetail, buildRuneSummary, newHistoryId } from '../lib/history';
import styles from './Rune.module.css';

type Phase = 'idle' | 'drawing' | 'revealing' | 'done';

const POSITIONS: RunePosition[] = ['situation', 'obstacle', 'advice'];

function drawRune(): RuneResult {
  const rune = RUNES[secureRandomInt(RUNES.length)];
  const orientation = chance(0.5) ? 'upright' : 'reversed';
  return { rune, orientation, position: 'situation' };
}

export function Rune() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [results, setResults] = useState<RuneResult[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const savedRef = useRef(false);

  const saveResults = useCallback((picked: RuneResult[]) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const interpretation = picked
      .map((r) => `[${RUNE_POSITION_LABEL[r.position]}] ${interpretRune(r)}`)
      .join('\n\n');
    const detail: RuneHistoryDetail = {
      kind: 'rune',
      results: picked,
      interpretation,
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'rune',
      date: new Date().toISOString(),
      summary: buildRuneSummary(picked),
      detail,
    });
  }, []);

  const startReading = useCallback(() => {
    if (phase === 'drawing' || phase === 'revealing') return;
    savedRef.current = false;
    setResults([]);
    setRevealIndex(0);
    setPhase('drawing');
    setTimeout(() => {
      const picked: RuneResult[] = [];
      for (let i = 0; i < 3; i++) {
        const r = drawRune();
        r.position = POSITIONS[i];
        picked.push(r);
      }
      setResults(picked);
      setPhase('revealing');
      let i = 0;
      const tick = () => {
        i += 1;
        setRevealIndex(i);
        if (i < picked.length) {
          setTimeout(tick, 600);
        } else {
          setPhase('done');
          saveResults(picked);
        }
      };
      setTimeout(tick, 400);
    }, 700);
  }, [phase, saveResults]);

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>ルーン占い</h1>
        <p class={styles.lede}>
          古代北欧の 24 ルーン + 白紙の「ヴィルド」。3 つの石を引いて、<br />
          状況 → 障害 → 助言 の流れを読み解きます。
        </p>
      </header>

      <div class={styles.action}>
        <Button onClick={startReading} size="lg" loading={phase === 'drawing'} disabled={phase === 'revealing'}>
          {phase === 'idle' || phase === 'done' ? '3 つの石を引く' : phase === 'drawing' ? '石を引いています…' : '石をめくっています…'}
        </Button>
      </div>

      <div class={styles.stones} aria-live="polite">
        {POSITIONS.map((pos, i) => {
          const result = results[i];
          const revealed = !!result && i < revealIndex;
          return (
            <div class={styles.stoneSlot} key={pos}>
              <span class={styles.label}>{RUNE_POSITION_LABEL[pos]}</span>
              <div class={`${styles.stoneWrap} ${revealed ? styles.revealed : styles.covered}`}>
                {(phase === 'drawing' || phase === 'idle' || (phase === 'revealing' && i >= revealIndex)) && (
                  <div class={styles.back}>
                    <RuneStone rune={RUNES[0]} size="md" />
                    <div class={styles.veil} />
                  </div>
                )}
                {revealed && result && (
                  <div class={`${styles.front} ${result.orientation === 'reversed' ? styles.flipped : ''}`}>
                    <RuneStone rune={result.rune} size="md" glow />
                  </div>
                )}
              </div>
              {revealed && result && (
                <p class={styles.stoneMeta}>
                  <strong>{result.rune.nameJp}</strong>
                  <span class={styles.orient}>
                    {result.orientation === 'upright' ? '正位置' : '逆位置'}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'done' && results.length === 3 && (
        <section class={styles.results}>
          {results.map((r) => (
            <ResultPanel
              key={`${r.rune.id}-${r.position}`}
              title={`${RUNE_POSITION_LABEL[r.position]}の石`}
              subtitle={`${r.rune.nameJp} · ${r.rune.nameOrigin} · ${r.orientation === 'upright' ? '正位置' : '逆位置'}`}
              keywords={r.rune.keywords}
              tone="purple"
            >
              {interpretRune(r)}
            </ResultPanel>
          ))}
        </section>
      )}

      <section class={styles.gallery}>
        <h2>ルーン一覧</h2>
        <p class={styles.muted}>25 ルーンすべての意味を一覧で確認できます。</p>
        <ul class={styles.galleryList}>
          {RUNES.map((r) => (
            <li key={r.id} class={styles.galleryItem}>
              <RuneStone rune={r} size="sm" />
              <div>
                <strong>{r.nameJp}</strong>
                <small class={styles.muted}>{r.nameOrigin}</small>
                <div class={styles.keywords}>
                  {r.keywords.map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
