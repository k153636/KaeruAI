import OpenAI from "openai";
import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";
import type { Profile, Idea, FeedbackStore } from "@/lib/types";
import { getPlatform } from "@/lib/platforms";

const redis = Redis.fromEnv();

function getOpenRouter() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ── Stage 1: 生成プロンプト ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは鋭い企画眼を持つコンテンツプロデューサーです。

【企画の核心原則】
良い企画とは「このクリエイターの複数の要素が交差する地点」から生まれる。
例：バイブコーディングをするクリエイターが音楽もやるなら、「コードの構造と音楽の構造は同じか？」という問いが生まれる。その問いが企画になる。

【気分・トピック指定の扱い方】
「今日の気分・やりたいこと」欄を次のように解釈する：
- 感情・雰囲気（例：やる気ない、元気）→ 企画のトーンや切り口に活かす。重い気分なら内省的な企画、テンション高いなら挑戦的な企画など
- トピック指定（例：AI関連の企画が欲しい、料理系で）→ そのテーマを軸に、プロフィールの要素で差別化する
どちらの場合も、プロフィールにない要素を勝手に追加しない。

【絶対禁止】
- 「〇〇してみた」「〇〇を検証」「〜の記録」など体験談フォーマットのタイトル
- 5企画すべてが同じフォーマット（全部「実験系」「体験談系」など）
- 「AIを使って〜」「〜ツール紹介」「〜おすすめ5選」という薄い軸だけで企画を組み立てること
- 「〜の話」「〜をやってみた結果」という弱い締め方のタイトル
- プロフィールに存在しない属性を主役にした企画（例：プロフィールがコーダーなのに「AI美女アバター」企画を出す）

【タイトルの質基準】
❌ 弱い：「AIで音楽を作ってみた話」「おすすめAIツール5選」「ChatGPTに質問し続けたら変化した」
✅ 強い：「バイブコーディングで書いたコードをドレミに変換したら、なぜか悲しい曲になった」「批評家として断言する：今のAI音楽ツール、全部同じ理由でダメ」「GPTに自分のコードを全部読ませたら、俺の癖を言い当てた」

強いタイトルのポイント：意外な結果・断言・具体的すぎる状況・続きが気になる未完の問い

【description の質基準】
❌ 悪い：「AIを使って音楽を作るプロセスを公開します。視聴者は体験できます。」
✅ 良い：「Cマイナーのコードを書くつもりだったのに、デバッグしながら聴いたら葬送行進曲になっていた。偶然性と意図の境界線が曖昧になる瞬間を、コード画面と音声を同時に映して記録する。」

良いdescriptionのポイント：具体的なシーン・予想外の展開・クリエイターの視点が入っている

【必須条件】
- 5企画それぞれ異なるフォーマット（考察・実験・批評・ドキュメント・対話 など）
- プロフィールにある複数の要素の「交差点」から企画を発想すること

返答は必ず指定されたJSON形式のみで行い、前後に余分なテキストを一切含めないでください。
すべての出力は日本語で行ってください。`;

// ── Stage 2: 批評・改善プロンプト ─────────────────────────────────────────────

const CRITIQUE_SYSTEM_PROMPT = `あなたは厳格な企画品質審査員です。渡された5つの企画ドラフトを審査し、基準を満たしていないものを書き直して返します。

【審査基準】
1. タイトルに「意外な結果・断言・具体的すぎる状況・未完の問い」のいずれかがあるか
2. プロフィールの複数の要素が交差しているか（1つの要素だけに依存していないか）
3. 「〇〇してみた」「〜の記録」「おすすめ〇選」「ツール紹介」など禁止パターンに引っかかっていないか
4. 5企画それぞれが異なるフォーマット（考察・批評・実験・ドキュメント・対話 など）になっているか
5. プロフィールにない属性が主役になっていないか

【過去フィードバックの扱い】
- 「好みの傾向」に近いテイストの企画は積極的に残す・強化する
- 「避けてほしい傾向」に近いタイトルや企画は必ず書き直す

【改善の方針】
- 基準を満たしている企画はそのまま返す（過剰に書き直さない）
- 基準を満たしていない企画だけを書き直す
- 書き直す際はプロフィールの別の交差点を探して完全に作り直す

返答は必ず指定されたJSON形式のみで行い、前後に余分なテキストを一切含めないでください。
すべての出力は日本語で行ってください。`;

// ── プロフィール narrative ────────────────────────────────────────────────────

function buildProfileNarrative(profile: Profile): string {
  const sentences: string[] = [];
  if (profile.creatorIdentity)   sentences.push(`${profile.creatorIdentity}タイプ`);
  if (profile.motivation)        sentences.push(`${profile.motivation}という動機で発信`);
  if (profile.contentApproach)   sentences.push(`${profile.contentApproach}を武器にする`);
  if (profile.expertise)         sentences.push(`得意領域は${profile.expertise}`);
  if (profile.hobby)             sentences.push(`${profile.hobby}に熱中している`);
  if (profile.audienceRelation)  sentences.push(`視聴者とは${profile.audienceRelation}の関係性を理想とする`);
  if (profile.targetAudience)    sentences.push(`届けたい相手は${profile.targetAudience}`);
  if (profile.bestComment)       sentences.push(`${profile.bestComment}というコメントが最も嬉しい`);
  if (profile.creativeTriger)    sentences.push(`${profile.creativeTriger}ときに作りたくなる`);
  if (profile.processingStyle)   sentences.push(`面白いものを見ると${profile.processingStyle}`);
  if (profile.successDefinition) sentences.push(`目指す状態は${profile.successDefinition}`);
  if (profile.dreamGoal)         sentences.push(`1年後の理想は${profile.dreamGoal}`);
  return sentences.join("。") + "。";
}

// ── Stage 1 ユーザープロンプト ─────────────────────────────────────────────────

function buildUserPrompt(mood: string, theme: string, condition: string, audience: string, profile: Profile, feedback: FeedbackStore): string {
  const platform = getPlatform(profile.platform);
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `\n【過去のフィードバック】\n${likedTitles ? `好みの傾向（このテイストに近づけて）：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}\n`
      : "";

  const profileNarrative = buildProfileNarrative(profile);

  return `【プラットフォーム】
${platform.label}（${platform.contentWord}を作っているクリエイター）

【発信目的】
${profile.contentNiche}

【このクリエイター像】
${profileNarrative}
${feedbackSection}【今の状態】
${mood}
${[theme && `テーマ：${theme}`, condition && `条件：${condition}`, audience && `視聴者：${audience}`].filter(Boolean).join("\n") ? `\n【追加指定】（必ず反映すること）\n${[theme && `テーマ：${theme}`, condition && `条件：${condition}`, audience && `視聴者：${audience}`].filter(Boolean).join("\n")}\n` : ""}${profile.avoid ? `\n【絶対に含めないこと】\n${profile.avoid}` : ""}

上記のクリエイター像・気分・目的を企画の方向性に活かしつつ、以下のJSON形式のみで5つの企画を返してください：
{
  "ideas": [
    {
      "title": "具体的で個性のあるタイトル（このクリエイターの視点・言葉が伝わるもの）",
      "description": "視聴者が『見たい』と思う理由を2文。動画内で何が起きるか・どんな体験ができるかを具体的に書く。プロフィールの言葉をそのまま使わない",
      "hook": "${platform.hookPlaceholder}",
      "thumbnail": "${platform.visualLabel}の構成案（具体的なレイアウト・文字・色・インパクト要素）",
      "filming": "${platform.productionLabel}：この企画を実際に作るための完全な手順。①使う具体的なツール・アプリ・サービス名（例：Suno、CapCut、OBS等）②各ステップで何をするか（準備→収録→編集の順で）③事前に用意すべき素材・環境 を箇条書きで。ツール名を省略せず必ず具体的に書く"
    }
  ]
}

条件：
- ${platform.label}に適したフォーマット・尺感
- 一人で制作できるスケール感
- 5企画それぞれ異なる切り口・フォーマット・トーン`;
}

// ── Stage 2 批評プロンプト ────────────────────────────────────────────────────

function buildCritiquePrompt(ideas: Idea[], profile: Profile, feedback: FeedbackStore, platform: ReturnType<typeof getPlatform>): string {
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `【過去フィードバック】\n${likedTitles ? `好みの傾向：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}\n\n`
      : "";

  const profileNarrative = buildProfileNarrative(profile);

  const ideasJson = JSON.stringify({ ideas }, null, 2);

  return `【クリエイター情報】
${profileNarrative}
${profile.avoid ? `絶対に含めないこと：${profile.avoid}\n` : ""}
${feedbackSection}【審査対象の企画ドラフト】
${ideasJson}

上記5企画を審査基準に照らして評価し、必要なものだけ書き直してください。
同じJSON形式で5企画を返してください：
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "hook": "${platform.hookPlaceholder}",
      "thumbnail": "...",
      "filming": "..."
    }
  ]
}`;
}

// ── AI呼び出し ────────────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await getOpenRouter().chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.85,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.85,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

async function callAI(isOwner: boolean, systemPrompt: string, userPrompt: string): Promise<string> {
  if (isOwner && process.env.OPENROUTER_API_KEY) {
    console.log("[generate] model: gemini-2.0-flash");
    return await callGemini(systemPrompt, userPrompt);
  }
  console.log("[generate] model: llama-3.3-70b");
  return await callGroq(systemPrompt, userPrompt);
}

function parseIdeas(text: string): Idea[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSONが見つかりませんでした");
  const repaired = jsonMatch[0].replace(/,(\s*[}\]])/g, "$1");
  const parsed = JSON.parse(repaired) as { ideas: Idea[] };
  if (!Array.isArray(parsed.ideas)) throw new Error("ideasが配列ではありません");
  return parsed.ideas;
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { mood, theme, condition, audience, profile, feedback } = (await request.json()) as {
      mood: string;
      theme?: string;
      condition?: string;
      audience?: string;
      profile: Profile;
      feedback: FeedbackStore;
    };

    if (!mood || !profile) {
      return Response.json({ error: "リクエストが不正です" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const whitelisted = (process.env.WHITELISTED_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const isDev = process.env.NODE_ENV === "development";
    const isOwner = isDev || whitelisted.includes(ip);

    if (!isOwner) {
      const key = `kaeruai:generate:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 86400);
      if (count > 10) {
        return Response.json(
          { error: "本日の生成上限（10回）に達しました。明日またお試しください。" },
          { status: 429 }
        );
      }
    }

    if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return Response.json({ error: "API キーが設定されていません" }, { status: 500 });
    }

    const safeFeeback: FeedbackStore = feedback ?? { liked: [], disliked: [] };
    const platform = getPlatform(profile.platform);

    // ── Stage 1: ドラフト生成 ────────────────────────────────────────────────
    console.log("[generate] stage1: drafting");
    const userPrompt = buildUserPrompt(mood, theme ?? "", condition ?? "", audience ?? "", profile, safeFeeback);

    let stage1Text = "";
    try {
      stage1Text = await callAI(isOwner, SYSTEM_PROMPT, userPrompt);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      stage1Text = await callAI(isOwner, SYSTEM_PROMPT, userPrompt);
    }

    const draftIdeas = parseIdeas(stage1Text);
    console.log("[generate] stage1: got", draftIdeas.length, "drafts");

    // ── Stage 2: 批評・改善 ──────────────────────────────────────────────────
    console.log("[generate] stage2: critiquing");
    const critiquePrompt = buildCritiquePrompt(draftIdeas, profile, safeFeeback, platform);

    let finalIdeas = draftIdeas;
    try {
      const stage2Text = await callAI(isOwner, CRITIQUE_SYSTEM_PROMPT, critiquePrompt);
      const refined = parseIdeas(stage2Text);
      if (refined.length === 5) {
        finalIdeas = refined;
        console.log("[generate] stage2: refined successfully");
      } else {
        console.warn("[generate] stage2: unexpected count, using draft");
      }
    } catch (e) {
      // Stage 2が失敗してもStage 1の結果を返す（品質より可用性を優先）
      console.warn("[generate] stage2 failed, using draft:", e instanceof Error ? e.message : e);
    }

    return Response.json({ ideas: finalIdeas });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", message);
    return Response.json({ error: `エラー: ${message}` }, { status: 500 });
  }
}
