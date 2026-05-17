import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";
import type { Profile, Idea, FeedbackStore } from "@/lib/types";
import { getPlatform } from "@/lib/platforms";

const redis = Redis.fromEnv();

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `あなたはコンテンツクリエイターの専属企画参謀です。
クリエイターのプロフィールを読み込み、そのクリエイターにしか作れない企画を提案します。

【絶対禁止】
- 「〇〇してみた」「〇〇を検証」「5つの〇〇」などの汎用タイトル
- 全企画でdescriptionの構造・文末が同じになること
- 「この動画では〜します。視聴者は〜を通じて〜を体験できます。」という文型の繰り返し

【description の質基準】
❌ 悪い例：「この動画では、クリエイターが音楽を作ります。視聴者はその過程を体験できます。」
✅ 良い例：「深夜2時に突然聴こえてきたメロディをそのままコードに落とした実録。『作れる気がしない』から始まったはずが、気づけば朝になっていた話をそのまま動画にする。」

良い例のポイント：具体的なシーン・時間・感情がある。誰が見るかではなく、何が起きるかが書いてある。

【必須条件】
- 5企画それぞれが異なる切り口・フォーマット・トーンを持つこと
- タイトルに具体的な数字・固有名詞・その人だけの視点を入れること

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

function buildUserPrompt(mood: string, profile: Profile, feedback: FeedbackStore): string {
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
${profile.avoid ? `\n【絶対に含めないこと】\n${profile.avoid}` : ""}

上記のクリエイター像・気分・目的を企画の方向性に活かしつつ、以下のJSON形式のみで5つの企画を返してください：
{
  "ideas": [
    {
      "title": "具体的で個性のあるタイトル（このクリエイターの視点・言葉が伝わるもの）",
      "description": "視聴者が『見たい』と思う理由を2文。動画内で何が起きるか・どんな体験ができるかを具体的に書く。プロフィールの言葉をそのまま使わない",
      "hook": "${platform.hookPlaceholder}",
      "thumbnail": "${platform.visualLabel}の構成案（具体的に）",
      "filming": "${platform.productionLabel}（必要な素材・場所・道具・構成順を箇条書き）"
    }
  ]
}

条件：
- ${platform.label}に適したフォーマット・尺感
- 一人で制作できるスケール感
- 5企画それぞれ異なる切り口・フォーマット・トーン`;
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.85,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function POST(request: Request) {
  try {
    const { mood, profile, feedback } = (await request.json()) as {
      mood: string;
      profile: Profile;
      feedback: FeedbackStore;
    };

    if (!mood || !profile) {
      return Response.json({ error: "リクエストが不正です" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const whitelisted = (process.env.WHITELISTED_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!whitelisted.includes(ip)) {
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

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "GROQ_API_KEY が設定されていません" }, { status: 500 });
    }

    const userPrompt = buildUserPrompt(mood, profile, feedback ?? { liked: [], disliked: [] });

    let text = "";
    try {
      text = await callGroq(SYSTEM_PROMPT, userPrompt);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      text = await callGroq(SYSTEM_PROMPT, userPrompt);
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Groq raw response:", text);
      return Response.json(
        { error: "AIの返答を解析できませんでした。もう一度お試しください。" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as { ideas: Idea[] };
    return Response.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", message);
    return Response.json({ error: `エラー: ${message}` }, { status: 500 });
  }
}
