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

function buildUserPrompt(mood: string, profile: Profile, feedback: FeedbackStore): string {
  const platform = getPlatform(profile.platform);
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `\n【過去のフィードバック】\n${likedTitles ? `好みの傾向（このテイストに近づけて）：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}\n`
      : "";

  const optionalFields = [
    profile.motivation       && `- コンテンツを作る動機：${profile.motivation}`,
    profile.bestComment      && `- 一番嬉しいフォロワーの反応：${profile.bestComment}`,
    profile.creativeTriger   && `- 創作衝動が湧く瞬間：${profile.creativeTriger}`,
    profile.audienceRelation && `- フォロワーとの距離感：${profile.audienceRelation}`,
    profile.targetAudience   && `- 届けたいターゲット：${profile.targetAudience}`,
    profile.contentApproach  && `- コンテンツの武器・アプローチ：${profile.contentApproach}`,
    profile.avoid            && `- 絶対にやりたくないこと：${profile.avoid}`,
    profile.processingStyle  && `- 情報処理スタイル：${profile.processingStyle}`,
    profile.creatorIdentity  && `- クリエイターとしての本質：${profile.creatorIdentity}`,
    profile.successDefinition && `- 成功の定義：${profile.successDefinition}`,
    profile.hobby            && `- 趣味・熱中していること：${profile.hobby}`,
    profile.expertise        && `- 得意なこと・強み：${profile.expertise}`,
    profile.dreamGoal        && `- 1年後の目標（逆算）：${profile.dreamGoal}`,
  ].filter(Boolean).join("\n");

  return `【プラットフォーム】
${platform.label}（${platform.contentWord}を作っているクリエイター）

【ここへ来た目的】
${profile.contentNiche}
${optionalFields ? `\n【クリエイタープロフィール】\n${optionalFields}` : ""}
${feedbackSection}
【今日の気分】
${mood}

【重要】以下のプロフィールを持つこのクリエイター以外には提案できない、固有の企画を生成すること。汎用的・テンプレート的な企画は不合格。

以下のJSON形式のみで5つの企画を返してください：
{
  "ideas": [
    {
      "title": "タイトル（数字・感情ワード・具体性を含むクリックされるもの）",
      "description": "このクリエイターがこれをやると面白い理由を2文で。プロフィールのキーワードを直接使わず、企画の核心と独自性を具体的に書く",
      "hook": "${platform.hookPlaceholder}",
      "thumbnail": "${platform.visualLabel}の構成案（具体的に）",
      "filming": "${platform.productionLabel}（必要な素材・場所・道具・構成順を箇条書き）"
    }
  ]
}

制約：
${profile.avoid            ? `- 「${profile.avoid}」は絶対に含めない` : "- 過激・炎上狙い・不快感を与える内容は避ける"}
${profile.creatorIdentity  ? `- ${profile.creatorIdentity}としての本質が滲み出る企画にする` : ""}
${profile.targetAudience   ? `- 今日の気分（${mood}）と届けたいターゲット（${profile.targetAudience}）を接続する` : `- 今日の気分（${mood}）に合った企画にする`}
${profile.contentApproach  ? `- コンテンツの武器（${profile.contentApproach}）を活かした企画にする` : ""}
${profile.bestComment      ? `- 「${profile.bestComment}」と言ってもらえる方向性にする` : ""}
${profile.motivation       ? `- 動機「${profile.motivation}」が体現される企画にする` : ""}
${profile.audienceRelation ? `- フォロワーとの距離感「${profile.audienceRelation}」が伝わるトーン・構成にする` : ""}
${profile.processingStyle  ? `- 情報処理スタイル「${profile.processingStyle}」がコンテンツ制作に活きる企画にする` : ""}
${profile.successDefinition ? `- 「${profile.successDefinition}」という成功イメージに近づく企画にする` : ""}
${profile.creativeTriger   ? `- 「${profile.creativeTriger}」という創作衝動が活きる企画にする` : ""}
${profile.hobby            ? `- 趣味（${profile.hobby}）をコンテンツのネタ・切り口として活用する` : ""}
${profile.expertise        ? `- 得意なこと（${profile.expertise}）を差別化ポイントとして活かす` : ""}
${profile.dreamGoal        ? `- 1年後の目標「${profile.dreamGoal}」に近づくための企画にする` : ""}
- ${platform.label}に適したフォーマット・尺感の企画にする
- 一人で制作できるスケール感にする
- 5つは互いに方向性が重複しないようにする`;
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
