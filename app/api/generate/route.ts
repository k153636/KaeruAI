import Groq from "groq-sdk";
import type { Profile, Idea, FeedbackStore } from "@/lib/types";
import { getPlatform } from "@/lib/platforms";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `あなたはコンテンツクリエイターの専属企画参謀です。
クリエイターの本質・動機・スタイルを深く理解し、そのクリエイターにしか作れない企画を提案します。
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
  ].filter(Boolean).join("\n");

  return `【プラットフォーム】
${platform.label}（${platform.contentWord}を作っているクリエイター）

【ここへ来た目的】
${profile.contentNiche}
${optionalFields ? `\n【クリエイタープロフィール】\n${optionalFields}` : ""}
${feedbackSection}
【今日の気分】
${mood}

以下のJSON形式のみで5つの企画を返してください：
{
  "ideas": [
    {
      "title": "タイトル（数字・感情ワード・具体性を含むクリックされるもの）",
      "description": "①何をするか ②なぜ面白いか ③フォロワーにとっての価値（3文）",
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
