import Groq from "groq-sdk";
import type { Profile, Idea, FeedbackStore } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(mood: string, profile: Profile, feedback: FeedbackStore): string {
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `\n【過去のフィードバック】\n${likedTitles ? `好みの傾向（このテイストに近づけて）：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}`
      : "";

  return `あなたはYouTuberの専属企画参謀です。以下のクリエイタープロフィールと今日の気分をもとに、実際のYouTubeチャンネルでそのまま使える高品質な企画を5つ提案してください。

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

以下のJSON形式のみで返答してください。前後に余分なテキストは絶対に含めないでください：
{
  "ideas": [
    {
      "title": "タイトル（視聴者がクリックしたくなる。数字・感情ワード・具体性を含む）",
      "description": "企画内容（3文。①何をするか ②なぜ面白いか ③視聴者にとっての価値）",
      "hook": "冒頭15秒のセリフ（そのまま読めるレベルで具体的に）",
      "thumbnail": "サムネイルの構成案（背景色・文字・表情・構図を具体的に）",
      "filming": "撮影メモ（必要な素材・場所・道具・構成の順番を箇条書きで）"
    }
  ]
}

制約：
- 「絶対にやりたくないこと」は絶対に含めない
- クリエイターの本質（${profile.creatorIdentity}）が自然に滲み出る企画にする
- 今日の気分を起点にしつつ、チャンネルの核（${profile.coreTheme}）と接続する
- 視聴者に「${profile.bestComment}」と言ってもらえる方向性にする
- 一人で撮影・編集できるスケール感にする
- 5つは互いに方向性が重複しないようにする
- titleとhookとthumbnailとfilmingはすべて日本語で出力する`;
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
      await new Promise((r) => setTimeout(r, 2000));
      text = await callGroq(prompt);
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Groq raw response:", text);
      return Response.json({ error: "AIの返答を解析できませんでした。もう一度お試しください。" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { ideas: Idea[] };
    return Response.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", message);
    return Response.json({ error: `エラー: ${message}` }, { status: 500 });
  }
}
