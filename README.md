# 毎日タロット＆占い

ブラウザだけで遊べる、4 種類の占いを集めたシングルページアプリケーション（SPA）です。
GitHub Pages にデプロイすれば、URL を開くだけですぐに遊べます。

- 公開 URL : `https://t1048.github.io/Mainichi-Tarots`

## 含まれる占い

| 占い | 概要 |
| --- | --- |
| 🃏 **タロット** | 78 枚フルデッキ。1 枚引きと 3 枚スプレッド（過去・現在・未来）に対応。正位置・逆位置はランダム。 |
| ᚠ **ルーン** | 24 ルーン + 白紙のヴィルド。3 石で状況・障害・助言を読む。 |
| ⛩ **おみくじ** | 大吉〜大凶の 7 段階。願い事・仕事・健康など 11 カテゴリの一言付き。 |
| ☯ **周易（易経）** | コイン 6 回で 1 卦を構成。本卦と之卦の両方を表示。 |

## 特徴

- **画像ファイル不要** — カード・ルーン・卦はすべて SVG で描画します
- **オフライン対応** — 外部通信に依存せず動作します
- **ダーク × 金 × 紫の配色** — 日本語 UI に対応しています
- **履歴保存** — 結果は `localStorage` に保存され、リロード後も残ります
- **アクセシビリティ** — `prefers-reduced-motion: reduce` 時はアニメーションを自動で無効化します
- **モバイル対応** — 375px 幅までレイアウトが崩れません

## 技術スタック

- [Vite 5](https://vitejs.dev/) + [Preact 10](https://preactjs.com/)（`preact-iso` でハッシュルーティング）
- TypeScript
- CSS Modules（フレームワーク非依存）
- `crypto.getRandomValues` ベースのセキュアな Fisher–Yates シャッフル

## 開発

```bash
# 依存インストール
npm install

# 開発サーバー (http://localhost:5173)
npm run dev

# 型チェック
npm run typecheck

# 本番ビルド (dist/ に出力)
npm run build

# ビルド成果物のプレビュー
npm run preview
```

## ディレクトリ

```
.
├── .github/workflows/deploy.yml  # GitHub Pages デプロイ
├── public/favicon.svg
├── src/
│   ├── main.tsx / app.tsx        # エントリ & ルーティング
│   ├── styles/                   # 配色 / タイポ / リセット
│   ├── components/               # 共通 UI (Layout, Button, CardSlot, RuneStone, …)
│   ├── pages/                    # ページ (Home, Tarot, Rune, Omikuji, IChing)
│   ├── lib/                      # rng / storage / format
│   └── data/                     # JSON データ + 型定義
└── index.html
```

## デプロイ

`main` ブランチに push すると、GitHub Actions が `dist/` を GitHub Pages にデプロイします。

- リポジトリ Settings > Pages > Source: **GitHub Actions** を選択
- 公開 URL は `https://<user>.github.io/<repo>/` (サブパス対応済み)

## 占い方

### タロット

1. ナビから「タロット」を選びます
2. タブで「1 枚引き」か「3 枚スプレッド（過去・現在・未来）」を切り替えます
3. 「カードを引く」を押すと、シャッフル後に 1 枚ずつめくられます
4. 結果に「正位置・逆位置」「キーワード」「解釈」が表示されます
5. 履歴タブで過去 30 件まで再閲覧できます

### ルーン

1. ナビから「ルーン」を選びます
2. 「3 つの石を引く」を押します
3. 白紙の石が順に裏返り、各ルーンの文字が表示されます
4. 1 番目＝状況、2 番目＝障害、3 番目＝助言として読みます
5. 25 文字の意味は画面下部の一覧で確認できます

### おみくじ

1. ナビから「おみくじ」を選びます
2. 「桶を振る」を押すと、桶が揺れて札が落ちてきます
3. 結果は 7 段階（大吉・吉・中吉・小吉・末吉・凶・大凶）で表示されます
4. 願い事・仕事・健康など 11 カテゴリの一言も合わせて確認できます

### 周易

1. ナビから「周易」を選びます
2. 「コインを 6 回投げる」を押すと、コインが 6 回振られ、各爻が決まります
3. 6（老陰）と 9（老陽）が出ると「変爻」になり、本卦から之卦への変化を示します
4. 変爻が出た位置はハイライトされ、具体的なメッセージとして読み取れます

## ライセンス

MIT

---

### ☕ サポート
このゲームが気に入っていただけたら、ぜひサポートをお願いします！  
いただいたご支援は、制作者の糧となり活力になります。


[![Support on Ko-fi](https://img.shields.io/badge/Support%20on%20Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/t1048)

---