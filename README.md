# 毎日タロット＆占い

ブラウザだけで楽しめる、日本語の占いシングルページアプリケーション（SPA）です。会員登録は不要。ホーム画面から「今日のワンオラクル」を引き、気になる占いをすぐに始められます。

[公開サイトを開く](https://t1048.github.io/Mainichi-Tarots/)

## ホーム画面

![毎日タロット＆占いのホーム画面。今日のワンオラクルとシャッフルの選択肢を表示](docs/images/home.png)

ホームでは日付に合わせたタロットを 1 枚引けます。結果は当日中は保持され、後から内容を見返せます。

## できること

| メニュー | 内容 |
| --- | --- |
| 🃏 **タロット占い** | 78 枚のフルデッキで、1 枚引きと過去・現在・未来の 3 枚スプレッドを楽しめます。正位置・逆位置に対応しています。 |
| ᛟ **ルーン占い** | 24 ルーンと白紙のヴィルドから 3 石を引き、状況・障害・助言を読み解きます。 |
| ⛩ **おみくじ** | 大吉から大凶まで 7 段階。願い事・仕事・健康など 11 カテゴリのメッセージ付きです。 |
| ☯ **周易（易経）** | コインを 6 回投げて本卦と之卦を導き、変爻も確認できます。 |
| ✵ **数秘術** | 生年月日からライフパスナンバーと、その年のサイクルナンバーを読み解きます。 |
| ♥ **タロット相性占い** | 1 枚 × 1 枚、または 3 枚 × 3 枚で二人の関係性を占えます。 |
| ☯ **二人の周易** | 二人が各 6 回、計 12 回コインを投げ、二つの卦から関係の二面性を見ます。 |

## 特徴

- **日替わりのワンオラクル** — ホームからそのまま今日のタロットを引けます。
- **デッキの継続性** — タロットは 78 枚の山札を保持し、引いたカードは山札から消費されます。シャッフル方法も選択できます。
- **履歴を 14 日間保存** — 引いた結果はブラウザ内に保存され、あとで見返したりコピーしたりできます。
- **オフラインでも利用可能** — PWA 対応。実行中に外部通信を必要としません。
- **画像アセット不要** — カード、ルーン、卦はすべて SVG で描画しています。
- **アクセシビリティとモバイル対応** — `prefers-reduced-motion` を尊重し、狭い画面でも利用できます。

## 技術スタック

- [Vite 5](https://vitejs.dev/) + [Preact 10](https://preactjs.com/) + `preact-iso`
- TypeScript（strict）
- CSS Modules
- `vite-plugin-pwa`
- `crypto.getRandomValues` を使う Fisher–Yates シャッフル

ルーティングは GitHub Pages のサブパス配信に適したハッシュルーティングです。占い結果・履歴・タロットの山札は `localStorage` に保存します。

## 開発

```bash
# 依存関係を再現可能にインストール
npm ci

# 開発サーバー（http://localhost:5173）
npm run dev

# 型チェック
npm run typecheck

# 本番ビルド（dist/ に出力）
npm run build

# ビルド成果物を確認
npm run preview
```

ローカル確認後は、CI と同じ順番で `npm run typecheck`、`npm run build` を実行します。

## プロジェクト構成

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages へのデプロイ
├── docs/images/home.png           # README 用ホーム画面キャプチャ
├── public/                        # PWA アイコンなど
├── src/
│   ├── components/                # 共通 UI・タロット表示・日替わりダッシュボード
│   ├── data/                      # タロット・ルーン・卦などの JSON データ
│   ├── lib/                       # 乱数・永続化・履歴・山札管理
│   ├── pages/                     # 各占いページ
│   ├── app.tsx                    # ハッシュルーティング
│   └── main.tsx                   # アプリ起動・PWA 登録
├── vite.config.ts
└── index.html
```

## デプロイ

`main` ブランチへ push すると GitHub Actions が `npm ci` → 型チェック → ビルドを実行し、`dist/` を GitHub Pages にデプロイします。

GitHub のリポジトリ設定で、Pages の公開元を **GitHub Actions** に設定してください。

## ライセンス

[MIT](LICENSE)

---

### ☕ サポート

このゲームが気に入っていただけたら、ぜひサポートをお願いします。いただいたご支援は、制作者の糧となり活力になります。

[![Support on Ko-fi](https://img.shields.io/badge/Support%20on%20Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/t1048)
