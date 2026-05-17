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
- 「〇〇してみた」「〇〇を検証」「5つの〇〇」など汎用タイトル
- description・hookにプロフィールのキーワードや制約文をそのまま引用すること（例：「収益化の可能性を探る」「距離感を保ちながら」といった制約の直訳）
- 全企画で同じ文末表現・同じ構成を繰り返すこと
- 「この企画では〜します。フォロワーは〜できます。」という機械的な3文テンプレート

【descriptionの書き方】
- 企画のユニークな核心を2文で書く
- 「なぜこのクリエイターがこれをやると面白いのか」を具体的に
- プロフィール情報は内面化して表現する（キーワードをそのまま書かない）

【必須条件】
- 5企画それぞれが異なる切り口・フォーマット・トーンを持つこと
- タイトルはそのクリエイターの視点・言葉が伝わる具体的なものにする

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
    model: "llama-3.3-70b-versatile",
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
