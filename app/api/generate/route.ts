import Groq from "groq-sdk";
import type { Profile, Idea, FeedbackStore } from "@/lib/types";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `あなたはYouTuberの専属企画参謀です。
クリエイターの本質・動機・スタイルを深く理解し、そのクリエイターにしか作れない企画を提案します。
返答は必ず指定されたJSON形式のみで行い、前後に余分なテキストを一切含めないでください。
すべての出力は日本語で行ってください。`;

function buildUserPrompt(mood: string, profile: Profile, feedback: FeedbackStore): string {
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `\n【過去のフィードバック】\n${likedTitles ? `好みの傾向（このテイストに近づけて）：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}\n`
      : "";

  return `【クリエイタープロフィール】
- 動画を作る動機：${profile.motivation}
- 一番嬉しい視聴者の反応：${profile.bestComment}
- 創作衝動が湧く瞬間：${profile.creativeTriger}
- 視聴者との理想の関係：${profile.audienceRelation}
- チャンネルの核となる問い：${profile.coreTheme}
- 絶対にやりたくないこと：${profile.avoid}
- 参考にしているコンテンツ・人物：${profile.reference}
- 情報処理スタイル：${profile.processingStyle}
- クリエイターとしての本質：${profile.creatorIdentity}
- 成功の定義：${profile.successDefinition}
${feedbackSection}
【今日の気分】
${mood}

以下のJSON形式のみで5つの企画を返してください：
{
  "ideas": [
    {
      "title": "タイトル（数字・感情ワード・具体性を含むクリックされるもの）",
      "description": "①何をするか ②なぜ面白いか ③視聴者にとっての価値（3文）",
      "hook": "冒頭15秒のセリフ（そのまま読めるレベルで具体的に）",
      "thumbnail": "サムネイル構成（背景色・メインビジュアル・テキスト・表情・構図）",
      "filming": "撮影メモ（必要な素材・場所・道具・構成順を箇条書き）"
    }
  ]
}

制約：
- 「絶対にやりたくないこと」は絶対に含めない
- ${profile.creatorIdentity}としての本質が滲み出る企画にする
- 今日の気分（${mood}）とチャンネルの核（${profile.coreTheme}）を接続する
- 「${profile.bestComment}」と言ってもらえる方向性にする
- 一人で撮影・編集できるスケール感にする
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
