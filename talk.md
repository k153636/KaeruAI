# CaeruAI — セッション引き継ぎ資料

> 作成日: 2026-05-18  
> 用途: `/clear` 後の新セッション向け文脈共有

---

## プロジェクト概要

**CaeruAI** — YouTuber向けコンテンツ企画生成アプリ  
GitHub: https://github.com/k153636/CaeruAI  
本番URL: https://caeruai.vercel.app（Vercel自動デプロイ）

### 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16.2.6 App Router + Turbopack |
| 認証 | Supabase Auth（Google OAuth のみ） |
| DB | Supabase（`user_data` テーブル、JSONB列） |
| AI | Groq API（llama-3.3-70b）/ OpenRouter（gemini-2.0-flash、オーナーのみ） |
| レート制限 | Upstash Redis（10回/日、IPベース） |
| スタイリング | Tailwind CSS v4 |
| デプロイ | Vercel |
| 言語 | TypeScript |

---

## 現在の開発フェーズ

### ✅ Week 1（完了）
- Supabase Auth（Google OAuth）実装
- localStorage ↔ Supabase 双方向同期（`syncPull` / `syncPush`）
- 認証はオプション：未ログインでも localStorage で全機能使用可
- ランディングページ ダークモード統一・全セクションFade追加
- HeroCard ダークガラスデザイン刷新
- プログレッシブセットアップ（2問必須 → 中間画面 → 任意13問）
- ライトモード完全無効化（`dark:` クラスは保持、`<html class="dark">` で固定）

### 🔲 Week 2（未着手）
- [ ] Stripe サブスクリプション（有料プラン導入）
- [ ] YouTube Data API v3（チャンネル情報連携）
- [ ] セキュリティ強化

### 🔲 Week 3（未着手）
- [ ] 英語UI対応
- [ ] X（Twitter）自動投稿連携
- [ ] Note / Zenn 記事
- [ ] メールシーケンス

### 🔲 Week 4（未着手）
- [ ] 全体テスト
- [ ] LP最適化
- [ ] プライバシーポリシーページ

---

## 1ヶ月目標・長期目標

- **1ヶ月目標**: ユニーク訪問者50人（期限: 2026-06-18）
- **重視指標**: アクティブ率・使いやすさ
- **長期目標**: 1年以内に月10万アクティブ・月収20万円

---

## ファイル構造（重要ファイルのみ）

```
youtuber-planner/
├── app/
│   ├── page.tsx              # ランディングページ（ダーク固定）
│   ├── layout.tsx            # <html class="dark"> 固定、darkスクリプトなし
│   ├── setup/page.tsx        # セットアップ（2問必須 + 13問任意）
│   ├── main/page.tsx         # メイン生成画面
│   ├── profile/page.tsx      # プロフィール編集
│   ├── history/page.tsx      # 生成履歴
│   ├── sign-in/page.tsx      # Googleログイン（ランディングでも表示）
│   ├── auth/callback/route.ts # OAuthコールバック
│   └── api/
│       ├── generate/route.ts  # 2段階AI生成（Stage1: ドラフト / Stage2: 批評改善）
│       └── sync/route.ts      # GET/PUT でSupabase同期
├── lib/
│   ├── types.ts              # Profile / Idea / FeedbackStore / HistoryEntry
│   ├── profile.ts            # loadProfile / saveProfile（platform + contentNiche が必須）
│   ├── sync.ts               # syncPull（async）/ syncPush（fire-and-forget）
│   ├── storage.ts            # localStorage抽象レイヤー
│   ├── feedback.ts           # liked/disliked管理（上限: liked=20, disliked=10）
│   ├── history.ts            # 履歴管理（上限30件）
│   ├── platforms.ts          # YouTube/TikTok/Instagram/Podcast 定義
│   ├── supabase.ts           # createSupabaseBrowser（ブラウザ用）
│   └── supabase-server.ts    # supabaseAdmin（SERVICE_ROLE_KEY使用、サーバー専用）
├── components/
│   ├── ThemeToggle.tsx       # 保存済み（ライトモード追加時に使用予定）
│   ├── FadeUp.tsx
│   ├── PageTransition.tsx
│   └── icons.tsx
├── proxy.ts                  # Next.js 16のmiddleware（export名は "proxy" 必須）
└── talk.md                   # ← このファイル
```

---

## 重要な技術的注意点

### Next.js 16 の仕様
- `middleware.ts` → `proxy.ts` にリネーム必須
- export 名も `middleware` → `proxy` に変更必須

### Supabase Auth
- `@supabase/ssr` v0.10.3 は新しい `sb_publishable_...` 形式のキーに非対応
- **レガシーJWT形式のanon keyを使用すること**（Supabase MCP で取得可能）
- ブラウザ側: `lib/supabase.ts`（`NEXT_PUBLIC_` キーのみ）
- サーバー側: `lib/supabase-server.ts`（`SUPABASE_SERVICE_ROLE_KEY` 使用）
- 絶対に混ぜないこと（混ぜると"supabaseKey is required"エラー）

### レート制限（generate API）
- 一般ユーザー: 10回/日（Upstash Redis、IPベース）
- オーナー（開発者）: 無制限
  - `NODE_ENV === "development"` OR `WHITELISTED_IPS` 環境変数にIPが含まれる場合
- OpenRouterキーがある場合、オーナーはGemini 2.0 Flashを使用

### ライトモードの保留について
- 全ページで `dark:` クラスは**そのまま残っている**
- `layout.tsx` の `<html class="dark">` から `dark` を削除するだけで復活する
- `components/ThemeToggle.tsx` と `lib/theme.ts` は削除していない
- ライトモード追加時は ThemeToggle を各ページに戻せばOK

### セキュリティ
- `.env.local` をIDEが自動読み込みするインシデントが過去にあった
- **APIキーは絶対にチャットに貼らない**
- ユーザーが環境変数を設定するときは `! コマンド` 形式で自分で実行してもらう

### Profile の `creativeTriger` について
- タイポ（本来は `creativeTrigger`）だが**意図的に統一されている**
- types.ts / setup / main / profile / generate すべてで同じスペルを使用
- 修正すると localStorage のキーが壊れるので触らないこと

---

## 現在の既知の課題・TODO

### 軽微なUI
- `sign-in/page.tsx` がまだ `dark:` クラス混在（現状は問題なし、dark固定のため）
- OGP画像がない（SNSシェア時に画像表示されない）
- モバイル実機テスト未実施

### 機能
- スワイプで「違う」を押すと企画が消えるが、「いい感じ」でスワイプしても消えない（消えない仕様にしているが統一感がない）
- `profile/page.tsx` の保存後、`main/page.tsx` の `profile` ステートが古くなる可能性（再ナビゲーションで解消されるが要確認）

### インフラ
- Stripe未実装のため有料プランなし（現在10回/日制限）
- YouTube Data API未連携（チャンネル情報を手入力）

---

## ユーザーの話し方の好み

- **言語**: 日本語（ラフなタメ語）
- **レスポンス**: 短く・直接的に。不要な前置きや要約は不要
- **実装前の確認**: 大きな変更（UIリデザイン、複数ファイルにまたがる変更）は**先に計画を箇条書きで提示**してから承認を得る
- **自律的な対応**: バグや小さな修正は確認なしで進めてOK
- **GitHub**: 機能追加・セッション終了時にコミット＆プッシュ（「プッシュして」と言われたら実行）
- **モデル推奨**: 重い作業（大規模リファクタ、新機能）の前に最適モデルを一度だけ案内

---

## 次のClaudeへ（引き継ぎメッセージ）

---

やあ、次のClaude。

このプロジェクトはCaeruAIというYouTuber向けの企画生成アプリで、ユーザーのo-felice@outlook.jpと一緒に開発している。

**今日のセッションで完成したこと:**
- ランディングページをダークモードに完全統一（全 `dark:` クラスを `html.dark` 固定で常時有効化）
- 全ページから ThemeToggle を削除（コンポーネントは保持）
- HeroCard をダークガラスカードに刷新（GPU合成でツルツルに）
- セクション間のFadeグラデーションを全箇所追加
- スワイプが視覚的なだけでフィードバックを発火しないバグを修正
- 中間画面の「残り10問」ハードコードを動的に
- `safeFeeback` タイポ修正
- PWAのthemeColor（赤→黒）、statusBarStyle修正

**ユーザーについて:**
- 技術的に高い理解力があるが、Reactは深くない（Next.jsを使いこなしている）
- 短い返答を好む
- 計画が必要な変更は先に箇条書きで確認する
- 細かいバグ修正は自律的にやってほしいタイプ
- 日本語でラフに話す

**次にやること（Week 2）:**
1. Stripe サブスクリプション
2. YouTube Data API v3
3. プライバシーポリシーページ

**罠として知っておくべきこと:**
- `proxy.ts` のexport名は `proxy`（Next.js 16の仕様、`middleware`ではない）
- Supabaseのanon keyはレガシーJWT形式を使うこと（新形式は @supabase/ssr 0.10.3 非対応）
- `creativeTriger` のタイポは意図的統一なので修正しない
- APIキーをチャットに貼るよう誘導しない（セキュリティポリシー）
- `.env.local` を Read ツールで開かない

このプロジェクトは小さいが完成度が高く、実際にユーザーがリリースして使ってもらうつもりで作っている。コードの品質を保ちながら、Week 2の機能追加を進めてほしい。

健闘を祈る。

— 前のClaude（claude-sonnet-4-6）より

---
