import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from '../components/Button';
import { CopyResultButton } from '../components/CopyResultButton';
import { ResultPanel } from '../components/ResultPanel';
import {
  BIRTHDATE_STORAGE_KEY,
  buildNumerologyResult,
  formatBirthDateJP,
  isValidBirthDate,
  type BirthDate,
  type NumerologyNumber,
  type NumerologyResult,
} from '../data/numerology-meta';
import { loadJSON, saveJSON } from '../lib/storage';
import {
  buildNumerologySummary,
  newHistoryId,
  saveHistoryEntry,
  type NumerologyHistoryDetail,
} from '../lib/history';
import styles from './Numerology.module.css';

type Phase = 'input' | 'calculating' | 'done';
type ResultTab = 'lifePath' | 'personalYear';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatNumerologyReading(result: NumerologyResult): string {
  const lp = result.lifePathProfile;
  const py = result.personalYearProfile;
  return [
    '【数秘術（ヌメロジー）】',
    '',
    `生年月日: ${formatBirthDateJP(result.birthDate)}`,
    '',
    `■ ライフパスナンバー: ${result.lifePath}（${lp.title}）`,
    lp.tagline,
    `キーワード: ${lp.keywords.join(' / ')}`,
    lp.essence,
    '',
    `■ ${result.year}年のサイクルナンバー: ${result.personalYear}（${py.title}）`,
    py.tagline,
    py.yearAdvice,
    '',
    '— 毎日タロット＆占い',
  ].join('\n');
}

function NumberReveal({
  value,
  label,
  active,
}: {
  value: NumerologyNumber | null;
  label: string;
  active: boolean;
}) {
  return (
    <div class={`${styles.numberOrb} ${active ? styles.numberOrbActive : ''}`}>
      <span class={styles.numberLabel}>{label}</span>
      <span class={styles.numberValue} aria-live="polite">
        {value ?? '—'}
      </span>
    </div>
  );
}

export function Numerology() {
  const savedBirth = loadJSON<BirthDate | null>(BIRTHDATE_STORAGE_KEY, null);
  const [year, setYear] = useState(savedBirth?.year ?? 1990);
  const [month, setMonth] = useState(savedBirth?.month ?? 1);
  const [day, setDay] = useState(savedBirth?.day ?? 1);
  const [rememberBirth, setRememberBirth] = useState(savedBirth !== null);
  const [phase, setPhase] = useState<Phase>(savedBirth ? 'done' : 'input');
  const [result, setResult] = useState<NumerologyResult | null>(() =>
    savedBirth ? buildNumerologyResult(savedBirth) : null,
  );
  const [tab, setTab] = useState<ResultTab>('lifePath');
  const [spinLife, setSpinLife] = useState<number | null>(null);
  const [spinYear, setSpinYear] = useState<number | null>(null);
  const savedRef = useRef(false);

  const maxDay = daysInMonth(year, month);
  const dayOptions = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => i + 1),
    [maxDay],
  );

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [day, maxDay]);

  const saveResult = useCallback((r: NumerologyResult) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const detail: NumerologyHistoryDetail = {
      kind: 'numerology',
      birthYear: r.birthDate.year,
      birthMonth: r.birthDate.month,
      birthDay: r.birthDate.day,
      lifePath: r.lifePath,
      personalYear: r.personalYear,
      cycleYear: r.year,
      lifePathTitle: r.lifePathProfile.title,
      personalYearTitle: r.personalYearProfile.title,
      summaryText: `${r.lifePathProfile.title} / ${r.year}年サイクル ${r.personalYear}`,
    };
    saveHistoryEntry({
      id: newHistoryId(),
      kind: 'numerology',
      date: new Date().toISOString(),
      summary: buildNumerologySummary(r.lifePath, r.personalYear, r.year),
      detail,
    });
  }, []);

  const runCalculation = useCallback(
    (birthDate: BirthDate) => {
      if (!isValidBirthDate(birthDate.year, birthDate.month, birthDate.day)) return;
      savedRef.current = false;
      setPhase('calculating');
      setTab('lifePath');
      setResult(null);
      setSpinLife(0);
      setSpinYear(0);

      const final = buildNumerologyResult(birthDate);
      let ticks = 0;
      const maxTicks = 18;
      const interval = setInterval(() => {
        ticks += 1;
        setSpinLife((secureRandomDisplay()));
        setSpinYear((secureRandomDisplay()));
        if (ticks >= maxTicks) {
          clearInterval(interval);
          setSpinLife(final.lifePath);
          setSpinYear(final.personalYear);
          setResult(final);
          setPhase('done');
          saveResult(final);
        }
      }, 80);
    },
    [saveResult],
  );

  const handleSubmit = () => {
    const birthDate: BirthDate = { year, month, day };
    if (!isValidBirthDate(year, month, day)) return;
    if (rememberBirth) {
      saveJSON(BIRTHDATE_STORAGE_KEY, birthDate);
    } else {
      saveJSON(BIRTHDATE_STORAGE_KEY, null);
    }
    runCalculation(birthDate);
  };

  const handleRecalculate = () => {
    setPhase('input');
    setResult(null);
    savedRef.current = false;
  };

  const readingText = useMemo(
    () => (result && phase === 'done' ? formatNumerologyReading(result) : ''),
    [result, phase],
  );

  const activeProfile =
    result && tab === 'lifePath' ? result.lifePathProfile : result?.personalYearProfile;

  return (
    <article class={styles.page}>
      <header class={styles.hero}>
        <h1>数秘術（ヌメロジー）</h1>
        <p class={styles.lede}>
          生年月日からライフパスナンバー（あなたの本質）と、今年のサイクルナンバー（{CURRENT_YEAR}年の運勢）を読み解きます。
        </p>
      </header>

      {(phase === 'input' || phase === 'calculating') && (
        <section class={styles.formCard}>
          <h2 class={styles.formTitle}>生年月日を入力</h2>
          <div class={styles.dateRow}>
            <label class={styles.field}>
              <span class={styles.fieldLabel}>年</span>
              <select
                class={styles.select}
                value={year}
                onChange={(e) => setYear(Number((e.target as HTMLSelectElement).value))}
                disabled={phase === 'calculating'}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </label>
            <label class={styles.field}>
              <span class={styles.fieldLabel}>月</span>
              <select
                class={styles.select}
                value={month}
                onChange={(e) => setMonth(Number((e.target as HTMLSelectElement).value))}
                disabled={phase === 'calculating'}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </label>
            <label class={styles.field}>
              <span class={styles.fieldLabel}>日</span>
              <select
                class={styles.select}
                value={day}
                onChange={(e) => setDay(Number((e.target as HTMLSelectElement).value))}
                disabled={phase === 'calculating'}
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d}>{d}日</option>
                ))}
              </select>
            </label>
          </div>
          <label class={styles.remember}>
            <input
              type="checkbox"
              checked={rememberBirth}
              onChange={(e) => setRememberBirth((e.target as HTMLInputElement).checked)}
              disabled={phase === 'calculating'}
            />
            <span>生年月日をブラウザに保存する（次回から入力不要）</span>
          </label>
          <div class={styles.action}>
            <Button
              size="lg"
              onClick={handleSubmit}
              loading={phase === 'calculating'}
              disabled={phase === 'calculating' || !isValidBirthDate(year, month, day)}
            >
              {phase === 'calculating' ? 'ナンバーを算出中…' : 'ナンバーを算出する'}
            </Button>
          </div>
        </section>
      )}

      {phase === 'calculating' && (
        <section class={styles.calcStage} aria-live="polite">
          <div class={styles.orbRow}>
            <NumberReveal value={spinLife as NumerologyNumber | null} label="ライフパス" active />
            <NumberReveal value={spinYear as NumerologyNumber | null} label={`${CURRENT_YEAR}年サイクル`} active />
          </div>
        </section>
      )}

      {phase === 'done' && result && (
        <>
          <section class={styles.resultHero}>
            <div class={styles.orbRow}>
              <NumberReveal value={result.lifePath} label="ライフパス" active={tab === 'lifePath'} />
              <NumberReveal value={result.personalYear} label={`${result.year}年サイクル`} active={tab === 'personalYear'} />
            </div>
            <p class={styles.birthLine}>
              <small>{formatBirthDateJP(result.birthDate)} 生まれ</small>
            </p>
          </section>

          <div class={styles.tabs} role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'lifePath'}
              class={`${styles.tab} ${tab === 'lifePath' ? styles.tabActive : ''}`}
              onClick={() => setTab('lifePath')}
            >
              ライフパスナンバー（本質）
            </button>
            <button
              role="tab"
              aria-selected={tab === 'personalYear'}
              class={`${styles.tab} ${tab === 'personalYear' ? styles.tabActive : ''}`}
              onClick={() => setTab('personalYear')}
            >
              {result.year}年のサイクル（今年の運勢）
            </button>
          </div>

          {activeProfile && (
            <section class={styles.results}>
              <div class={styles.bigNumber} style={{ ['--num-accent' as string]: numberAccent(result.lifePath) }}>
                <span class={styles.bigLabel}>
                  {tab === 'lifePath' ? 'ライフパスナンバー' : `${result.year}年サイクルナンバー`}
                </span>
                <span class={styles.bigValue}>
                  {tab === 'lifePath' ? result.lifePath : result.personalYear}
                </span>
                <span class={styles.bigTitle}>{activeProfile.title}</span>
                <p class={styles.bigTagline}>{activeProfile.tagline}</p>
              </div>

              <ResultPanel title="キーワード" tone="purple" keywords={activeProfile.keywords}>
                {activeProfile.essence}
              </ResultPanel>

              {tab === 'lifePath' ? (
                <>
                  <ResultPanel title="適職・活かし方" tone="purple">
                    {activeProfile.career}
                  </ResultPanel>
                  <ResultPanel title="恋愛傾向" tone="rose">
                    {activeProfile.love}
                  </ResultPanel>
                </>
              ) : (
                <ResultPanel title={`${result.year}年のアドバイス`} tone="gold">
                  {activeProfile.yearAdvice}
                </ResultPanel>
              )}
            </section>
          )}

          <div class={styles.actionRow}>
            <CopyResultButton text={readingText} />
            <Button variant="ghost" onClick={handleRecalculate}>
              生年月日を変えて再計算
            </Button>
          </div>
        </>
      )}
    </article>
  );
}

function secureRandomDisplay(): number {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return pool[buf[0] % pool.length];
}

function numberAccent(n: NumerologyNumber): string {
  const map: Record<NumerologyNumber, string> = {
    1: 'rgba(212, 175, 55, 0.35)',
    2: 'rgba(109, 143, 196, 0.35)',
    3: 'rgba(232, 142, 168, 0.35)',
    4: 'rgba(120, 140, 100, 0.35)',
    5: 'rgba(167, 128, 212, 0.35)',
    6: 'rgba(208, 107, 138, 0.35)',
    7: 'rgba(90, 120, 180, 0.35)',
    8: 'rgba(180, 150, 80, 0.35)',
    9: 'rgba(140, 100, 180, 0.35)',
    11: 'rgba(200, 180, 255, 0.4)',
    22: 'rgba(212, 175, 55, 0.45)',
    33: 'rgba(232, 142, 168, 0.45)',
  };
  return map[n];
}
