import type { ComponentChildren } from 'preact';
import { useLocation } from 'preact-iso';
import { useRef, useState } from 'preact/hooks';
import { HistoryModal } from './HistoryModal';
import styles from './Layout.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { href: '/', label: 'ホーム', icon: '✦' },
  { href: '/tarot', label: 'タロット', icon: '☽' },
  { href: '/rune', label: 'ルーン', icon: 'ᛟ' },
  { href: '/omikuji', label: 'おみくじ', icon: '⛩' },
  { href: '/iching', label: '周易', icon: '☯' },
];

export function Layout({ children }: { children: ComponentChildren }) {
  const { path } = useLocation();
  const hash = `#${path || '/'}`;
  const [showHistory, setShowHistory] = useState(false);
  const historyBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setShowHistory(false);
    historyBtnRef.current?.focus();
  };

  return (
    <div class={styles.shell}>
      <header class={styles.header}>
        <a class={styles.brand} href="#/">
          <span class={styles.brandMark} aria-hidden="true">✦</span>
          <span class={styles.brandText}>毎日タロット＆占い</span>
        </a>
        <nav class={styles.nav} aria-label="主要ナビゲーション">
          {NAV.map((item) => {
            const active = path === item.href || (item.href === '/' && path === '/');
            return (
              <a
                key={item.href}
                class={`${styles.navLink} ${active ? styles.active : ''}`}
                href={`#${item.href}`}
                aria-current={active ? 'page' : undefined}
              >
                <span class={styles.navIcon} aria-hidden="true">{item.icon}</span>
                <span class={styles.navLabel}>{item.label}</span>
              </a>
            );
          })}
          <button
            ref={historyBtnRef}
            class={styles.historyBtn}
            onClick={() => setShowHistory(true)}
            aria-label="履歴を開く"
          >
            <span class={styles.navIcon} aria-hidden="true">🕘</span>
            <span class={styles.navLabel}>履歴</span>
          </button>
        </nav>
      </header>
      <main>{children}</main>
      {showHistory && <HistoryModal onClose={handleClose} />}
      <footer class={styles.footer}>
        <small>
          © {new Date().getFullYear()} Mainichi Tarots · 画像アセットを含まない、ブラウザで動く占い SPA
          <span class={styles.path}>({hash})</span>
        </small>
      </footer>
    </div>
  );
}
