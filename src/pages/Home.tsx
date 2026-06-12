import { Button } from '../components/Button';
import { formatDateJP } from '../lib/format';
import styles from './Home.module.css';

interface NavCard {
  href: string;
  title: string;
  icon: string;
  desc: string;
  accent: 'gold' | 'purple' | 'rose' | 'indigo';
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
    desc: '64 卦から 1 卦 + 変爻を引く。6 回のコイン投げを再現。',
    accent: 'indigo',
  },
];

export function Home() {
  const today = new Date();

  return (
    <article class={styles.page}>
      <section class={styles.hero}>
        <h1 class={styles.title}>今日のひと引きを。</h1>
        <p class={styles.lede}>
          ブラウザだけで遊べる、4 つの占い。
          <br />
          カードは全部 SVG で描いているから、画像アセットは不要。気になるものをひとつ選んでください。
        </p>
        <div class={styles.heroActions}>
          <a class={styles.cta} href="#/tarot">
            <Button size="lg">今日のタロットを引く</Button>
          </a>
          <a class={styles.ctaSecondary} href="#/omikuji">
            <Button variant="secondary" size="lg">
              おみくじを引く
            </Button>
          </a>
        </div>
        <p class={styles.dateLine}>
          <small>{formatDateJP(today)}</small>
        </p>
      </section>

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
          すべての絵柄は SVG で動的生成しています。外部画像やフォントを読み込まないので、電波が弱い場所でもサクサク。
          結果は <code class="kbd">localStorage</code> に保存され、リロードしても履歴が残ります。
        </p>
        <ul>
          <li>ダーク × 金 × 紫の神秘的な配色</li>
          <li>アニメーションは <code class="kbd">prefers-reduced-motion</code> 設定で自動 OFF</li>
          <li>モバイル幅 (375px) までレスポンシブ対応</li>
        </ul>
      </section>
    </article>
  );
}
