# 毎日タロット＆占い — GitHub Pages 占いアプリ 実装計画

## 概要

GitHub Pages 上で動作する、ブラウザだけで遊べる占い SPA。

- メイン: **タロット占い**(大アルカナ 22 枚 + 小アルカナ 56 枚 = 78 枚フル)
  - 1 枚引き(今日のカード)
  - 3 枚スプレッド(過去 / 現在 / 未来)
  - 正位置 / 逆位置ランダム
- サブ占い:
  - **ルーン占い**(24 文字 + ブランク ルーン)
  - **おみくじ**(大吉 〜 大凶)
  - **周易(易経)**(64 卦からランダムに 1 卦 + 変爻)
- 共通 UX:
  - カード・記号・ルーン文字は **SVG インライン描画**(画像アセット同梱なし、ライセンスクリーン)
  - 1 ページ完結の SPA。ルーティングは `hash` ベース(`#/tarot`, `#/rune`, `#/omikuji`, `#/iching`)
  - 結果履歴は `localStorage` に保存(「今日の結果を見る」機能)
  - ダーク × 神秘的な配色(紫 / 金 / 紺)、日本語 UI
- 技術スタック:
  - **Vite 5** + **Preact 10**(`preact-iso` でルーティング)
  - TypeScript
  - CSS は素の CSS / CSS Modules(フレームワーク非依存)
  - ビルド成果物を **main ブランチ直下**(`dist/` をルート)に配信
  - GitHub Actions 経由で `dist/` を main にデプロイ(`peaceiris/actions-gh-pages`)

## ディレクトリ構成

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # build → dist/ を main ルートへデプロイ
├── .gitignore
├── index.html                  # Vite エントリ
├── package.json
├── tsconfig.json
├── vite.config.ts              # base: './' (サブパス対応)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                # ルート描画
│   ├── app.tsx                 # ルーティング + ナビ
│   ├── styles/
│   │   ├── global.css          # リセット・配色・タイポ
│   │   └── tokens.css          # カラー・スペーシング CSS 変数
│   ├── components/
│   │   ├── Layout.tsx          # ヘッダ / フッタ
│   │   ├── Button.tsx
│   │   ├── CardSlot.tsx        # カード置き場(めくり演出)
│   │   ├── TarotCard.tsx       # 78 枚の SVG 描画
│   │   ├── RuneStone.tsx       # ルーン SVG 描画
│   │   ├── Hexagram.tsx        # 64 卦 SVG 描画
│   │   └── ResultPanel.tsx     # 結果解説パネル
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Tarot.tsx           # 1枚 / 3枚 モード切替
│   │   ├── Rune.tsx
│   │   ├── Omikuji.tsx
│   │   └── IChing.tsx
│   ├── lib/
│   │   ├── rng.ts              # crypto.getRandomValues ベースの Fisher–Yates
│   │   ├── storage.ts          # localStorage ラッパ
│   │   └── format.ts           # 日付フォーマット等
│   └── data/
│       ├── tarot-major.json    # 22 枚: 番号 / 名前 / 上向き / 下向き / キーワード
│       ├── tarot-minor.json    # 56 枚: スート(ワンド/カップ/ソード/ペンタクル)× 1–14
│       ├── tarot-meta.ts       # 上記 JSON を結合して 78 枚の配列を生成
│       ├── runes.json          # 24 文字 + blank: 名前 / 文字 / 上向き / 下向き
│       ├── omikuji.json        # 7 段階運勢 + カテゴリ別(恋愛/仕事/健康/金運)短文
│       ├── iching.json         # 64 卦: 名称 / 卦辞 / 爻辞(簡略) / 上卦 / 下卦
│       └── templates.ts        # 解釈テキスト雛形生成
└── README.md                   # 使い方・占い方
```

## データモデル

### タロット(`TarotCard`)

```ts
type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
type TarotCard = {
  id: string;            // "major-0", "wands-1", "cups-14" ...
  arcana: 'major' | 'minor';
  number: number;        // major: 0–21 / minor: 1–14
  suit?: Suit;           // minor のみ
  nameJp: string;        // "愚者", "ワンドのエース"
  upright: { keywords: string[]; summary: string };
  reversed: { keywords: string[]; summary: string };
};
```

解釈は雛形ベース:

```ts
// templates.ts
function interpret(card: TarotCard, orientation: 'upright' | 'reversed', position?: 'past' | 'present' | 'future') {
  const posText = position
    ? { past: 'あなたを形作ってきた背景', present: '今のあなた', future: 'これからの流れ' }[position]
    : '今日のあなた';
  const tone = orientation === 'upright' ? card.upright : card.reversed;
  return `${posText}には「${tone.keywords[0]}」のテーマが働いています。${tone.summary}`;
}
```

### ルーン(`Rune`)

24 文字(Fehu, Uruz, …, Dagaz) + Wyrd(ブランク)。各 rune に:

- `symbolSvgPath: string`(1 ストロークの SVG path)
- `nameJp`, `nameOrigin`, `meaning: { upright, reversed }`, `keywords[]`

3 枚引き(状況 / 障害 / 助言)を用意。

### おみくじ(`Omikuji`)

- `fortune: '大吉' | '吉' | '中吉' | '小吉' | '末吉' | '凶' | '大凶'`
- 配点テーブル(大吉 5% / 吉 20% … 大凶 3%)で重み付き抽選
- カテゴリ: 願い事 / 待ち人 / 失せ物 / 旅行 / 仕事 / 学問 / 健康 / 結婚 / 相場 / 転居 / 家族 — 各 1 行短文

### 周易(`Hexagram`)

- 64 卦を `upperTrigram × lowerTrigram`(八卦: 乾・兌・離・震・巽・坎・艮・坤)で生成
- データは番号 / 名称 / 卦辞 / 各爻辞(簡略)を保持
- 「3 つの硬貨を 6 回」相当のコイン投げを再現: 1 卦 + 1 変爻を導出

## 描画戦略(画像アセットなし)

- **タロット**: 矩形フレーム + 上部に `number` をローマ数字 + 中央にスート絵文字記号(♠ ♥ ♦ ♣ を SVG で自作)+ 名前。色カードは CSS 変数でスート別(赤 / 青 / 緑 / 黄)。
- **ルーン**: `<svg><path d="..."/></svg>` を 24 個インライン定義。ホバー / 結果時に淡く光るアニメ。
- **卦**: 6 本の横線(`━━━━` = 陽、`━ ━` = 陰)を CSS で描画。シンプルな ASCII 風デザイン。
- カードの「めくり」演出: CSS 3D transform(`transform: rotateY(180deg)`)を使用、JS で 1 枚ずつディレイ。

## 主要ページ UX

### Home(`/`)
- 4 つの占いカード → ナビ。タロットを強調表示。
- 「今日の運勢」ボタン: 1 枚引きのショートカット。

### Tarot(`/tarot`)
- モード切替タブ: **1 枚引き** / **3 枚スプレッド**(過去/現在/未来)
- 「カードを引く」ボタン → シャッフル(200ms アニメ)→ カードを表にして 1 枚ずつ提示
- 結果: カード名 / 正逆 / キーワード / 解釈テキスト
- 共有: `?r=...` で結果を URL エンコード(プリセット可能)

### Rune(`/rune`)
- 3 つの石(状況を象徴)を引く → 各 rune を SVG 表示
- 解釈はテンプレ結合。

### Omikuji(`/omikuji`)
- 桶を振るアニメ(translateY 振動) → 結果札が落ちてくる演出
- 運勢 + カテゴリ別短文。

### IChing(`/iching`)
- コインを 6 回投げる演出 → 卦を構成 → 卦名と解釈

## ルーティング

`preact-iso` を使用。`/`, `/#/tarot`, `/#/rune`, `/#/omikuji`, `/#/iching`。  
GitHub Pages は SPA の history API ルートを直接開くと 404 になるため、**ハッシュルーティング**を採用。

## デプロイ(`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deploy
        uses: actions/deploy-pages@v4
```

- `vite.config.ts` で `base: './'` を指定(リポジトリ名サブパス対応)
- Pages 設定: Settings > Pages > Source: **GitHub Actions**

## package.json スクリプト

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

## 実装ステップ(マイルストーン)

1. **基盤**: `package.json` / `tsconfig` / `vite.config` / `index.html` / `main.tsx` / `app.tsx`(ルーティングのみ、空ページ)
2. **デザインシステム**: `tokens.css` / `global.css` / `Layout` / `Button`
3. **データ層**: `rng.ts` / `storage.ts` / `tarot-meta.ts` / `templates.ts`
4. **タロット描画**: `TarotCard.tsx` + 78 枚の JSON 投入 + `CardSlot` めくり演出
5. **タロットページ**: 1 枚 / 3 枚、結果表示、`localStorage` 履歴
6. **ルーン**: `RuneStone.tsx` + 25 rune データ + `Rune.tsx`
7. **おみくじ**: 配点テーブル + アニメ + `Omikuji.tsx`
8. **周易**: 64 卦生成 + コイン投げ + `IChing.tsx`
9. **Home 整備 + README** + ファビコン
10. **GitHub Actions デプロイ設定** + 動作確認

## 検証チェックリスト

- [ ] `npm run typecheck` が通る
- [ ] `npm run build` が警告なく完走
- [ ] `dist/` をローカルで `npx serve dist` し 4 占いすべてでカード描画・結果が崩れない
- [ ] リロードしても結果履歴が残る
- [ ] スマホ幅(375px)でレイアウト崩れなし
- [ ] アニメーションを `prefers-reduced-motion: reduce` で無効化
- [ ] 画像 / フォントアセット 0 個(SVG / CSS のみ)
- [ ] GitHub Actions が main push で成功、公開 URL で実際に遊べる

## スコープ外(将来拡張)

- 日替わり星座 / 数秘術
- 結果の画像共有(OGP 生成)
- 多言語対応
- PWA(オフラインキャッシュ)
- 結果シェア(URL 短縮 or Web Share API)
