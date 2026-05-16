import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Profile, Idea } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { mood, profile } = (await request.json()) as {
      mood: string;
      profile: Profile;
    };

    if (!mood || !profile) {
      return Response.json({ error: "リクエストが不正です" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 });
    }

    const prompt = `あなたはYouTuberの専属企画参謀です。以下のクリエイタープロフィールと今日の気分をもとに、このクリエイターにしか作れない企画を5つ提案してください。

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
- 実際に一人で撮影・編集できるスケール感にする`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini raw response:", text);
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
