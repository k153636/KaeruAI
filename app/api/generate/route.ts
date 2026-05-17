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

function buildUserPrompt(mood: string, themes: string[], profile: Profile, feedback: FeedbackStore): string {
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
${feedbackSection}
【今日の気分】
${mood}
${themes.length > 0 ? `\n【テーマ・条件】（必ず全て反映すること）\n${themes.map((t) => `・${t}`).join("\n")}\n` : ""}${profile.avoid ? `\n【絶対に含めないこと】\n${profile.avoid}` : ""}

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

export async function POST(request: Request) {
  try {
    const { mood, themes, profile, feedback } = (await request.json()) as {
      mood: string;
      themes?: string[];
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

    const userPrompt = buildUserPrompt(mood, themes ?? [], profile, feedback ?? { liked: [], disliked: [] });

    let text = "";
    try {
      text = await callAI(isOwner, SYSTEM_PROMPT, userPrompt);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      text = await callAI(isOwner, SYSTEM_PROMPT, userPrompt);
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Groq raw response:", text);
      return Response.json(
        { error: "AIの返答を解析できませんでした。もう一度お試しください。" },
        { status: 500 }
      );
    }

    const repaired = jsonMatch[0].replace(/,(\s*[}\]])/g, "$1");
    const parsed = JSON.parse(repaired) as { ideas: Idea[] };
    return Response.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", message);
    return Response.json({ error: `エラー: ${message}` }, { status: 500 });
  }
}
