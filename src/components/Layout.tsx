import type { ComponentChildren } from 'preact';
import { useLocation } from 'preact-iso';
import { useEffect, useRef, useState } from 'preact/hooks';
import { HistoryModal } from './HistoryModal';
import styles from './Layout.module.css';

interface NavChild {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  children: NavChild[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'normal',
    label: '通常',
    icon: '✦',
    children: [
      { href: '/tarot', label: 'タロット', icon: '☽' },
      { href: '/rune', label: 'ルーン', icon: 'ᛟ' },
      { href: '/omikuji', label: 'おみくじ', icon: '⛩' },
      { href: '/iching', label: '周易', icon: '☯' },
      { href: '/numerology', label: '数秘術', icon: '✵' },
    ],
  },
  {
    id: 'love',
    label: '恋愛',
    icon: '♥',
    children: [
      { href: '/love/tarot', label: 'タロット相性占い', icon: '♥' },
      { href: '/love/iching', label: '二人の周易', icon: '☯' },
    ],
  },
];

function isChildActive(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`);
}

function isGroupActive(path: string, group: NavGroup): boolean {
  if (group.id === 'love') {
    return path.startsWith('/love/');
  }
  return group.children.some((child) => isChildActive(path, child.href));
}

function NavDropdown({
  group,
  path,
  openId,
  setOpenId,
}: {
  group: NavGroup;
  path: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const isOpen = openId === group.id;
  const groupActive = isGroupActive(path, group);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpenId]);

  const toggle = () => setOpenId(isOpen ? null : group.id);

  return (
    <div
      ref={groupRef}
      class={`${styles.navGroup} ${group.id === 'love' ? styles.navGroupEnd : ''}`}
    >
      <button
        type="button"
        class={`${styles.navTrigger} ${groupActive ? styles.active : ''} ${isOpen ? styles.open : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span class={styles.navIcon} aria-hidden="true">{group.icon}</span>
        <span class={styles.navLabel}>{group.label}</span>
        <span class={styles.navChevron} aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
      </button>
      {isOpen && (
        <ul class={styles.navMenu} role="menu" aria-label={`${group.label}メニュー`}>
          {group.children.map((child) => {
            const active = isChildActive(path, child.href);
            return (
              <li key={child.href} role="none">
                <a
                  class={`${styles.navMenuLink} ${active ? styles.active : ''}`}
                  href={`#${child.href}`}
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpenId(null)}
                >
                  <span class={styles.navIcon} aria-hidden="true">{child.icon}</span>
                  <span class={styles.navLabel}>{child.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ComponentChildren }) {
  const { path } = useLocation();
  const hash = `#${path || '/'}`;
  const [showHistory, setShowHistory] = useState(false);
  const [openNavId, setOpenNavId] = useState<string | null>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const homeActive = path === '/';

  useEffect(() => {
    setOpenNavId(null);
  }, [path]);

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
          <a
            class={`${styles.navLink} ${homeActive ? styles.active : ''}`}
            href="#/"
            aria-current={homeActive ? 'page' : undefined}
          >
            <span class={styles.navIcon} aria-hidden="true">✦</span>
            <span class={styles.navLabel}>ホーム</span>
          </a>
          {NAV_GROUPS.map((group) => (
            <NavDropdown
              key={group.id}
              group={group}
              path={path}
              openId={openNavId}
              setOpenId={setOpenNavId}
            />
          ))}
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
