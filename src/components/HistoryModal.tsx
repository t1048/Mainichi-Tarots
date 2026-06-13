import { useEffect, useRef, useState } from 'preact/hooks';
import { Button } from './Button';
import { formatDateJP, formatTimeJP } from '../lib/format';
import { clearHistory, loadAllHistory, type BaseHistoryEntry, type FortuneKind } from '../lib/history';
import { RUNE_POSITION_LABEL } from '../data/rune-meta';
import { orientationLabel, POSITION_LABELS } from '../data/tarot-meta';
import styles from './HistoryModal.module.css';

const FILTER_KINDS: { value: 'all' | FortuneKind; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'tarot', label: 'タロット' },
  { value: 'rune', label: 'ルーン' },
  { value: 'omikuji', label: 'おみくじ' },
  { value: 'iching', label: '周易' },
  { value: 'numerology', label: '数秘術' },
  { value: 'love-tarot', label: '恋愛タロット' },
  { value: 'love-iching', label: '二人の周易' },
];

const KIND_LABELS: Record<FortuneKind, string> = {
  tarot: 'タロット',
  rune: 'ルーン',
  omikuji: 'おみくじ',
  iching: '周易',
  numerology: '数秘術',
  'love-tarot': '恋愛タロット',
  'love-iching': '二人の周易',
};

interface Props {
  onClose: () => void;
}

export function HistoryModal({ onClose }: Props) {
  const [entries, setEntries] = useState(() => loadAllHistory());
  const [filter, setFilter] = useState<'all' | FortuneKind>('all');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.kind === filter);

  const handleClear = () => {
    if (!confirm('すべての履歴を削除します。よろしいですか？')) return;
    clearHistory('all');
    setEntries([]);
  };

  return (
    <div class={styles.overlay} onClick={onClose} role="presentation">
      <div
        class={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header class={styles.header}>
          <h2 id="history-title" class={styles.title}>履歴</h2>
          <button ref={closeRef} class={styles.closeBtn} onClick={onClose} aria-label="閉じる">×</button>
        </header>

        <div class={styles.tabs} role="tablist">
          {FILTER_KINDS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                role="tab"
                aria-selected={active}
                class={`${styles.tab} ${active ? styles.tabActive : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div class={styles.body}>
          {filtered.length === 0 ? (
            <p class={styles.empty}>まだ履歴がありません。</p>
          ) : (
            <ul class={styles.list}>
              {filtered.map((entry) => (
                <li key={entry.id} class={styles.item}>
                  <div class={styles.itemHead}>
                    <span class={styles.date}>{formatDateJP(new Date(entry.date))} {formatTimeJP(new Date(entry.date))}</span>
                    <span class={`${styles.badge} ${styles[entry.kind]}`}>{KIND_LABELS[entry.kind]}</span>
                  </div>
                  <div class={styles.summary}>{entry.summary}</div>
                  <details class={styles.details}>
                    <summary>解釈を開く</summary>
                    <HistoryDetail entry={entry} />
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer class={styles.footer}>
          <Button variant="ghost" size="sm" onClick={handleClear}>全削除</Button>
          <Button onClick={onClose}>閉じる</Button>
        </footer>
      </div>
    </div>
  );
}

function HistoryDetail({ entry }: { entry: BaseHistoryEntry }) {
  switch (entry.detail.kind) {
    case 'tarot':
      return (
        <div class={styles.detailBody}>
          {entry.detail.drawn.map((d, i) => (
            <div key={`${d.card.id}-${i}`} class={styles.detailLine}>
              <strong>{POSITION_LABELS[d.position] ?? '今日'}:</strong> {d.card.nameJp} · {orientationLabel(d.orientation)}
            </div>
          ))}
          <pre class={styles.detailText}>{entry.detail.interpretation}</pre>
        </div>
      );
    case 'rune':
      return (
        <div class={styles.detailBody}>
          {entry.detail.results.map((r, i) => (
            <div key={`${r.rune.id}-${i}`} class={styles.detailLine}>
              <strong>{RUNE_POSITION_LABEL[r.position]}:</strong> {r.rune.nameJp} · {orientationLabel(r.orientation)}
            </div>
          ))}
          <pre class={styles.detailText}>{entry.detail.interpretation}</pre>
        </div>
      );
    case 'omikuji':
      return (
        <div class={styles.detailBody}>
          <div class={styles.detailLine}><strong>{entry.detail.level}</strong></div>
          <div class={styles.detailLine}>{entry.detail.summary}</div>
          {entry.detail.categories.map((c) => (
            <div key={c.label} class={styles.detailLine}>
              <strong>{c.label}:</strong> {c.text}
            </div>
          ))}
        </div>
      );
    case 'iching':
      return (
        <div class={styles.detailBody}>
          <div class={styles.detailLine}><strong>本卦:</strong> {entry.detail.primaryNum}. {entry.detail.primaryName}</div>
          {entry.detail.changedNum !== null && (
            <div class={styles.detailLine}><strong>変化した卦:</strong> {entry.detail.changedNum}. {entry.detail.changedName}</div>
          )}
          {entry.detail.changedLine !== null && (
            <div class={styles.detailLine}><strong>変化の線:</strong> 第{entry.detail.changedLine}の線</div>
          )}
          <div class={styles.detailLine}>{entry.detail.judgment}</div>
        </div>
      );
    case 'love-tarot':
      return (
        <div class={styles.detailBody}>
          <div class={styles.detailLine}>
            <strong>あなた:</strong> {entry.detail.you.card.nameJp} · {orientationLabel(entry.detail.you.orientation)}
          </div>
          <div class={styles.detailLine}>
            <strong>相手:</strong> {entry.detail.partner.card.nameJp} · {orientationLabel(entry.detail.partner.orientation)}
          </div>
          <div class={styles.detailLine}><strong>共通テーマ:</strong> {entry.detail.commonTheme}</div>
          <div class={styles.detailLine}><strong>補完関係:</strong> {entry.detail.complement}</div>
          <div class={styles.detailLine}><strong>緊張点:</strong> {entry.detail.tension}</div>
        </div>
      );
    case 'love-iching':
      return (
        <div class={styles.detailBody}>
          <div class={styles.detailLine}><strong>あなた:</strong> {entry.detail.yourHexNum}. {entry.detail.yourHexName}</div>
          <div class={styles.detailLine}><strong>相手:</strong> {entry.detail.partnerHexNum}. {entry.detail.partnerHexName}</div>
          <div class={styles.detailLine}><strong>組み合わせ A:</strong> {entry.detail.aHexNum}. {entry.detail.aHexName}</div>
          <div class={styles.detailLine}><strong>組み合わせ B:</strong> {entry.detail.bHexNum}. {entry.detail.bHexName}</div>
          <div class={styles.detailLine}><strong>A 卦辞:</strong> {entry.detail.aJudgment}</div>
          <div class={styles.detailLine}><strong>B 卦辞:</strong> {entry.detail.bJudgment}</div>
        </div>
      );
    case 'numerology':
      return (
        <div class={styles.detailBody}>
          <div class={styles.detailLine}>
            <strong>生年月日:</strong> {entry.detail.birthYear}年{entry.detail.birthMonth}月{entry.detail.birthDay}日
          </div>
          <div class={styles.detailLine}>
            <strong>ライフパス:</strong> {entry.detail.lifePath}（{entry.detail.lifePathTitle}）
          </div>
          <div class={styles.detailLine}>
            <strong>{entry.detail.cycleYear}年サイクル:</strong> {entry.detail.personalYear}（{entry.detail.personalYearTitle}）
          </div>
          <div class={styles.detailLine}>{entry.detail.summaryText}</div>
        </div>
      );
  }
}
