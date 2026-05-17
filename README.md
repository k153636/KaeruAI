# KaeruAI — コンテンツ企画メーカー

今日の気分を一言入力するだけで、あなた専用の企画を5つ生成するAIツールです。

## 主な機能

- **企画生成** — 気分・プロフィール・過去のフィードバックを元に、Groq（llama-3.3-70b-versatile）が企画を5件提案
- **マルチプラットフォーム対応** — YouTube / TikTok・Reels / Instagram / Podcast / ブログ・note / X (Twitter) / 配信
- **プログレッシブセットアップ** — 2問だけ答えればすぐ使える。あとから追加回答するほどAI精度が上がる
- **フィードバック学習** — 「いい感じ」「違う」を押すと次回生成に反映
- **履歴管理** — 過去の生成結果をいつでも確認
- **ダークモード対応**

## 企画カードの内容

各企画にはプラットフォームに合わせて以下が含まれます：

| 項目 | YouTube | TikTok/Reels | Podcast |
|------|---------|--------------|---------|
| フック | 冒頭15秒のセリフ | 冒頭3秒のフック | オープニングトーク |
| ビジュアル | サムネイル案 | サムネイル案 | エピソードアート案 |
| 制作メモ | 撮影メモ | 撮影メモ | 収録メモ |

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| AI | Groq API — llama-3.3-70b-versatile |
| スタイリング | Tailwind CSS v4 |
| 言語 | TypeScript |
| デプロイ | Vercel |
| データ永続化 | localStorage（サーバー不要） |

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/kaeruai.git
cd kaeruai
npm install
```

### 2. 環境変数を設定

`.env.local` を作成：

```env
GROQ_API_KEY=your_groq_api_key_here
```

Groq APIキーは [console.groq.com](https://console.groq.com) で取得できます（無料枠あり）。

### 3. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## Vercelへのデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kaeruai)

デプロイ後、Vercelの環境変数に `GROQ_API_KEY` を追加してください。

## プロジェクト構成

```
app/
  page.tsx          # ルート（プロフィールの有無でリダイレクト）
  setup/page.tsx    # セットアップフロー（2問必須 → 10問任意）
  main/page.tsx     # メイン画面（企画生成）
  profile/page.tsx  # プロフィール編集
  history/page.tsx  # 生成履歴
  api/generate/     # Groq APIルート
lib/
  types.ts          # 型定義
  profile.ts        # プロフィールの読み書き
  platforms.ts      # プラットフォーム定義
  feedback.ts       # フィードバックの読み書き
  history.ts        # 履歴の読み書き
  storage.ts        # localStorage抽象化
components/
  FadeUp.tsx        # アニメーションコンポーネント
  ThemeToggle.tsx   # ダークモード切り替え
  icons.tsx         # アイコン
```

## ライセンス

MIT
