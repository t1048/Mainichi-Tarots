import { DailyTarotDashboard } from '../components/DailyTarotDashboard';
import { formatDateJP } from '../lib/format';
import styles from './Home.module.css';

interface NavCard {
  href: string;
  title: string;
  icon: string;
  desc: string;
  accent: 'gold' | 'purple' | 'rose' | 'indigo' | 'love' | 'violet';
  primary?: boolean;
}

const NAV_CARDS: NavCard[] = [
  {
    href: '/tarot',
    title: 'タロット占い',
    icon: '☽',
    desc: '78 枚のフルデッキから引く、本格的スプレッド。',
    accent: 'gold',
    primary: true,
  },
  {
    href: '/rune',
    title: 'ルーン占い',
    icon: 'ᛟ',
    desc: '古代北欧の 24 ルーン + 白紙のヴィルド。3 枚で状況・障害・助言を占う。',
    accent: 'purple',
  },
  {
    href: '/omikuji',
    title: 'おみくじ',
    icon: '⛩',
    desc: '大吉 〜 大凶の 7 段階。願い事・健康・金運など 11 カテゴリから運勢を引く。',
    accent: 'rose',
  },
  {
    href: '/iching',
    title: '周易(易経)',
    icon: '☯',
    desc: '64 卦から 1 卦 + 変化の線を引く。6 回のコイン投げを再現。',
    accent: 'indigo',
  },
  {
    href: '/numerology',
    title: '数秘術（ヌメロジー）',
    icon: '✵',
    desc: '生年月日からライフパスナンバーと今年のサイクルナンバーを読み解く。',
    accent: 'violet',
  },
  {
    href: '/love/tarot',
    title: 'タロット相性占い',
    icon: '♥',
    desc: '78 枚のフルデッキから引き、1 枚 × 1 枚または 3 枚 × 3 枚で二人の関係性を読み解きます。',
    accent: 'love',
  },
  {
    href: '/love/iching',
    title: '二人の周易',
    icon: '☯',
    desc: '2 人で 6 投 × 2 = 12 投。互いの卦を組み合わせて、関係の二面性を見ます。',
    accent: 'love',
  },
];

export function Home() {
  const today = new Date();

  return (
    <article class={styles.page}>
      <section class={styles.hero}>
        <h1 class={styles.title}>今日のひと引きを。</h1>
        <p class={styles.dateLine}>
          <small>{formatDateJP(today)}</small>
        </p>
      </section>

      <DailyTarotDashboard />

      <section class={styles.grid} aria-label="占いメニュー">
        {NAV_CARDS.map((card) => (
          <a
            key={card.href}
            class={`${styles.card} ${styles[card.accent]} ${card.primary ? styles.primary : ''}`}
            href={`#${card.href}`}
          >
            <span class={styles.cardIcon} aria-hidden="true">
              {card.icon}
            </span>
            <h2 class={styles.cardTitle}>{card.title}</h2>
            <p class={styles.cardDesc}>{card.desc}</p>
            {card.primary && <span class={styles.ribbon}>おすすめ</span>}
          </a>
        ))}
      </section>

      <section class={styles.note}>
        <h3>このサイトについて</h3>
        <p>
          朝の気分付けにも、夜の一人時間にも——タロット・ルーン・おみくじ・周易・数秘術を、ブラウザひとつで。
          会員登録は不要。ページを開いて、今日のひと引きから始められます。
        </p>
        <ul>
          <li>ホームから今日のタロットをその場で引ける</li>
          <li>引いた結果は履歴からあとで見返せる</li>
          <li>恋愛・相性向けの占いも同じ画面から</li>
        </ul>
      </section>
    </article>
  );
}
