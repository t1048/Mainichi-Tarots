import styles from './LoveHome.module.css';

interface LoveMenuCard {
  href: string;
  title: string;
  icon: string;
  desc: string;
}

const LOVE_MENU: LoveMenuCard[] = [
  {
    href: '/love/tarot',
    title: 'タロット相性占い',
    icon: '♥',
    desc: '78 枚のフルデッキから 2 枚を引き、あなたと相手の関係性を読み解きます。',
  },
  {
    href: '/love/iching',
    title: '二人の周易',
    icon: '☯',
    desc: '2 人で 6 投 × 2 = 12 投。互いの卦を組み合わせて、関係の二面性を見ます。',
  },
];

export function LoveHome() {
  return (
    <article class={styles.page}>
      <section class={styles.hero}>
        <h1 class={styles.title}>恋愛・相性占い</h1>
        <p class={styles.lede}>
          気になるあの人との関係性を、2 種類の占いで読み解きます。<br />
          どちらもブラウザ内で完結。入力した情報はどこにも送信されません。
        </p>
      </section>

      <section class={styles.grid} aria-label="恋愛占いメニュー">
        {LOVE_MENU.map((card) => (
          <a
            key={card.href}
            class={styles.card}
            href={`#${card.href}`}
          >
            <span class={styles.cardIcon} aria-hidden="true">
              {card.icon}
            </span>
            <h2 class={styles.cardTitle}>{card.title}</h2>
            <p class={styles.cardDesc}>{card.desc}</p>
          </a>
        ))}
      </section>

      <section class={styles.note}>
        <h3>恋愛占いの読み方</h3>
        <ul>
          <li><strong>タロット相性</strong>は、二枚の関係から「共通テーマ」「補完関係」「緊張点」を読みます。</li>
          <li><strong>二人の周易</strong>は、上下卦を入れ替えた 2 種類の組み合わせ卦で「あなたの視点」「相手の視点」を描きます。</li>
          <li>結果は 14 日間 <code class="kbd">localStorage</code> に保存され、履歴タブからいつでも見返せます。</li>
        </ul>
      </section>
    </article>
  );
}
