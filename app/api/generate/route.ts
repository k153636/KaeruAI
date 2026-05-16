import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Profile, Idea } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const { mood, profile } = (await request.json()) as {
    mood: string;
    profile: Profile;
  };

  if (!mood || !profile) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const prompt = `あなたはYouTuberの企画参謀です。以下のYouTuberのプロフィールと今日の気分をもとに、具体的で面白い企画を5つ提案してください。

【チャンネルプロフィール】
- ジャンル・テーマ：${profile.genre}
- チャンネルの強み：${profile.strength}
- 視聴者に感じてほしいこと：${profile.moodGoal}
- 絶対にやりたくないこと：${profile.avoid}
- 参考にしているコンテンツ：${profile.reference}
- チャンネルを一言で言うと：${profile.tagline}

【今日の気分】
${mood}

以下のJSON形式で厳密に返答してください。他のテキストは一切含めないでください：
{
  "ideas": [
    {
      "title": "動画タイトル（視聴者がクリックしたくなる具体的なタイトル）",
      "description": "企画の内容説明（2〜3文で具体的に）",
      "hook": "最初の15秒で使える掴みセリフ"
    }
  ]
}

条件：
- 「絶対にやりたくないこと」は絶対に含めない
- 今日の気分とチャンネルの強みを掛け合わせた企画にする
- 視聴者に「${profile.moodGoal}」と感じてもらえる内容にする
- タイトルは具体的で数字や感情ワードを活用する
- 実際に撮影できそうな現実的な企画にする
- チャンネルの個性（${profile.tagline}）が出る企画にする`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: "AIの返答を解析できませんでした" }, { status: 500 });
  }

  const parsed = JSON.parse(jsonMatch[0]) as { ideas: Idea[] };

  return Response.json(parsed);
}
