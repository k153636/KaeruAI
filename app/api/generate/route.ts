import Groq from "groq-sdk";
import type { Profile, Idea, FeedbackStore } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(
  mood: string,
  profile: Profile,
  feedback: FeedbackStore
): string {
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `
【過去のフィードバック】
${likedTitles ? `気に入った企画の傾向（このテイストに近づけて）：\n${likedTitles}` : ""}
${dislikedTitles ? `気に入らなかった企画（このテイストは避けて）：\n${dislikedTitles}` : ""}`
      : "";

  return `あなたはYouTuberの専属企画参謀です。以下のクリエイタープロフィールと今日の気分をもとに、このクリエイターにしか作れない企画を5つ提案してください。

【クリエイタープロフィール】
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

以下のJSON形式のみで返答してください。前後に余分なテキストは不要です：
{
  "ideas": [
    {
      "title": "タイトル（視聴者がクリックしたくなる具体的なもの）",
      "description": "企画内容（2〜3文。何をどう撮るか具体的に）",
      "hook": "冒頭15秒の掴みセリフ"
    }
  ]
}

制約：
- 「絶対にやりたくないこと」は絶対に含めない
- クリエイターの本質（${profile.creatorIdentity}）が自然に滲み出る企画にする
- 今日の気分を起点にしつつ、チャンネルの核（${profile.coreTheme}）と接続する
- 視聴者に「${profile.bestComment}」と言ってもらえるような方向性にする
- 実際に一人で撮影・編集できるスケール感にする
- 5つの企画は互いに方向性が重複しないようにする`;
}

async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
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

    const prompt = buildPrompt(mood, profile, feedback ?? { liked: [], disliked: [] });

    let text = "";
    try {
      text = await callGroq(prompt);
    } catch {
      // 1回だけ自動リトライ
      await new Promise((r) => setTimeout(r, 2000));
      text = await callGroq(prompt);
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
