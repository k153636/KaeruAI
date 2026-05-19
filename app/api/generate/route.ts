import OpenAI from "openai";
import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";
import type { Profile, Idea, FeedbackStore, YoutubeChannelData, TrendingData } from "@/lib/types";
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

// ── Stage 1: 生成プロンプト ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは鋭い企画眼を持つコンテンツプロデューサーです。

【企画の核心原則】
プロフィール情報が豊富な場合：「複数の要素が交差する地点」から企画を発想する。
例：料理クリエイターが歴史好きなら「江戸時代の1日の食費を現代で再現」という交差が生まれる。

プロフィール情報が少ない場合：ジャンルの「意外な切り口・常識の裏返し・業界のタブー」を軸に発想する。
例：料理ジャンルのみなら「プロが絶対やらない調理法をあえてやったら何が起きるか」のような、ジャンル内の意外性を突く。

【気分・トピック指定の扱い方】
- 感情・雰囲気（例：やる気ない、元気）→ 企画のトーンや切り口に活かす
- トピック指定（例：AI関連、料理系）→ そのテーマを軸にプロフィール要素で差別化
- プロフィールにない要素を勝手に追加しない

【絶対禁止】
- 「〇〇してみた」「〇〇を検証」「〜の記録」など体験談フォーマットのタイトル
- 5企画すべてが同じフォーマット（全部「実験系」など）
- 「〜ツール紹介」「〜おすすめ5選」という薄い軸だけの企画
- 「〜の話」「〜をやってみた結果」という弱い締め方のタイトル
- プロフィールに存在しない属性を主役にした企画
- プロフィールに明記されていない経歴・資格・年数（「〇〇歴10年」「現役〇〇」等）をタイトルや説明に入れること

【タイトルの質基準】
❌ 弱い：「おすすめAIツール5選」「料理を時短してみた」「ChatGPTに質問し続けたら変化した」
✅ 強い：「プロの料理人が『絶対やるな』と言う調理法を全部やったら、なぜか美味かった」「断言する：今の料理系YouTuberが全員同じ理由で飽きられている」「レシピ通りに作ったのに別の料理になった。何が起きていたのか」

強いタイトルのポイント：意外な結果・断言・具体的すぎる状況・続きが気になる未完の問い

【description の質基準】
❌ 悪い：「料理のプロセスを公開します。視聴者が楽しめます。」
✅ 良い：「レシピ本通りに作ったのに、火加減を1段階変えるたびに味が別物になった。何十回と試して見えてきたのは、レシピが『省略している』情報の正体だった。」

良いdescriptionのポイント：具体的なシーン・予想外の展開・クリエイターの視点

【必須条件】
- 5企画それぞれ異なるフォーマット（考察・批評・実験・ドキュメント・対話 など）
- 1人・家庭用機材・1週間以内で制作できる現実的なスケール感

返答は必ず指定されたJSON形式のみで行い、前後に余分なテキストを一切含めないでください。
すべての出力は日本語で行ってください。`;

// ── Stage 2: 批評・改善プロンプト ─────────────────────────────────────────────

const CRITIQUE_SYSTEM_PROMPT = `あなたは厳格な企画品質審査員です。渡された5つの企画ドラフトを審査し、基準を満たしていないものを書き直して返します。

【審査基準】
1. タイトルに「意外な結果・断言・具体的すぎる状況・未完の問い」のいずれかがあるか
2. 「〇〇してみた」「〜の記録」「おすすめ〇選」「ツール紹介」など禁止パターンに引っかかっていないか
3. 5企画それぞれが異なるフォーマット（考察・批評・実験・ドキュメント・対話 など）になっているか
4. プロフィールにない属性が主役になっていないか
5. 【実行可能性】1人・家庭用機材・1週間以内で本当に制作できるか。「スタジオが必要」「複数人のゲスト」「大規模な仕込み」が必要な企画は書き直す
6. 【固有性】このクリエイター以外でも成立する企画になっていないか。「誰でも作れる汎用企画」は書き直す
7. 【filmingの具体性】filming欄に具体的なアプリ・ツール・サービス名が2つ以上含まれているか。「スマホで撮影」「編集ソフトで編集」など曖昧な記述のみの場合は具体名を追加する

【過去フィードバックの扱い】
- 「好みの傾向」に近いテイストの企画は積極的に残す・強化する
- 「避けてほしい傾向」に近いタイトルや企画は必ず書き直す

【改善の方針】
- 基準を満たしている企画はそのまま返す（過剰に書き直さない）
- 基準を満たしていない企画だけを書き直す
- 書き直す際はジャンルの別の切り口・意外性を探して完全に作り直す

返答は必ず指定されたJSON形式のみで行い、前後に余分なテキストを一切含めないでください。
すべての出力は日本語で行ってください。`;

// ── プロフィール narrative ────────────────────────────────────────────────────

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

// ── Stage 1 ユーザープロンプト ─────────────────────────────────────────────────

function buildYoutubeSection(yt: YoutubeChannelData): string {
  if (!yt.topVideos.length) return "";
  const topList = yt.topVideos
    .map((v) => `  - 「${v.title}」`)
    .join("\n");
  return `【過去に反響があったコンテンツスタイル（参考）】
${topList}
※ 上記はこのクリエイターの既存コンテンツ。同じテーマの焼き直しではなく、このスタイル・視点を活かしながら新しい切り口で企画を作ること。`;
}

function buildTrendingSection(trending: TrendingData): string {
  if (!trending.videos.length) return "";
  const list = trending.videos.map((v) => `  - 「${v.title}」`).join("\n");
  return `【直近7日間のトレンド（このジャンルでバズっている動画）】
${list}
※ これらのトレンドを「把握した上で」、まだ誰も語っていない角度・意外な視点から企画を作ること。トレンドの焼き直し・類似タイトルは禁止。`;
}

function buildUserPrompt(mood: string, theme: string, condition: string, audience: string, profile: Profile, feedback: FeedbackStore, youtubeData?: YoutubeChannelData | null, trendingData?: TrendingData | null): string {
  const platform = getPlatform(profile.platform);
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `\n【過去のフィードバック】\n${likedTitles ? `好みの傾向（このテイストに近づけて）：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}\n`
      : "";

  const profileNarrative = buildProfileNarrative(profile);
  const hasRichProfile = profileNarrative.split("。").filter(Boolean).length >= 3;

  const ideationGuide = hasRichProfile
    ? `発想の軸：プロフィールにある複数の要素（ジャンル・動機・趣味・視聴者像など）が交差する地点から企画を作ること。交差がなければ書き直すこと。`
    : `発想の軸：プロフィール情報が少ないため、「${profile.contentNiche}」ジャンルの中で「業界の常識を疑う・プロが言わない本音・初心者が陥りやすい誤解・視聴者が気づいていない盲点」を切り口に企画を発想すること。すでに結果や実績があることを前提にした企画は禁止。`;

  const youtubeSection = youtubeData ? `\n${buildYoutubeSection(youtubeData)}\n` : "";
  const trendingSection = trendingData ? `\n${buildTrendingSection(trendingData)}\n` : "";

  return `【プラットフォーム】
${platform.label}（${platform.contentWord}を作っているクリエイター）

【発信ジャンル・テーマ】（最重要：すべての企画はこのジャンルの中から発想すること）
${profile.contentNiche}
${youtubeSection}${trendingSection}
【このクリエイター像】
${profileNarrative || "（詳細プロフィール未設定）"}
${feedbackSection}【今の状態・やりたいこと】
${mood}
${[theme && `テーマ：${theme}`, condition && `条件：${condition}`, audience && `視聴者：${audience}`].filter(Boolean).join("\n") ? `\n【追加指定】（必ず反映すること）\n${[theme && `テーマ：${theme}`, condition && `条件：${condition}`, audience && `視聴者：${audience}`].filter(Boolean).join("\n")}\n` : ""}${profile.avoid ? `\n【絶対に含めないこと】\n${profile.avoid}\n` : ""}
【発想ガイド】
${ideationGuide}

以下のJSON形式のみで5つの企画を返してください：
{
  "ideas": [
    {
      "title": "このクリエイターの視点・言葉が伝わる具体的なタイトル。「してみた」「検証」「まとめ」禁止",
      "description": "視聴者が『これは見たい』と思う理由を2文。『何が起きるか』『どんな発見があるか』を具体的に。クリエイターの主観・驚き・葛藤を入れる",
      "hook": "${platform.hookPlaceholder}",
      "thumbnail": "${platform.visualLabel}の構成案（文字・色・レイアウト・インパクト要素を具体的に）",
      "filming": "${platform.productionLabel}：①使用する具体的なアプリ・ツール・サービス名を2つ以上明記（例：CapCut、OBS Studio、Notion、ChatGPT等）②準備→収録→編集の順で各ステップを箇条書き③事前に用意する素材・環境。『スマホで撮影』『編集ソフト』など曖昧な表現は禁止。必ず固有名を書くこと"
    }
  ]
}

制作条件：
- ${platform.label}に適したフォーマット・尺感
- 1人・家庭用機材・1週間以内で制作できるスケール
- 5企画それぞれ異なるフォーマット（考察・批評・実験・ドキュメント・対話 から選ぶ）`;
}

// ── Stage 2 批評プロンプト ────────────────────────────────────────────────────

function buildCritiquePrompt(ideas: Idea[], profile: Profile, feedback: FeedbackStore, platform: ReturnType<typeof getPlatform>): string {
  const likedTitles = feedback.liked.slice(0, 8).map((e) => `・${e.title}`).join("\n");
  const dislikedTitles = feedback.disliked.slice(0, 5).map((e) => `・${e.title}`).join("\n");

  const feedbackSection =
    likedTitles || dislikedTitles
      ? `【過去フィードバック】\n${likedTitles ? `好みの傾向：\n${likedTitles}\n` : ""}${dislikedTitles ? `避けてほしい傾向：\n${dislikedTitles}` : ""}\n\n`
      : "";

  const profileNarrative = buildProfileNarrative(profile);

  const ideasJson = JSON.stringify({ ideas }, null, 2);

  return `【クリエイター情報】
${profileNarrative}
${profile.avoid ? `絶対に含めないこと：${profile.avoid}\n` : ""}
${feedbackSection}【審査対象の企画ドラフト】
${ideasJson}

上記5企画を審査基準に照らして評価し、必要なものだけ書き直してください。
同じJSON形式で5企画を返してください：
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "hook": "${platform.hookPlaceholder}",
      "thumbnail": "...",
      "filming": "..."
    }
  ]
}`;
}

// ── AI呼び出し ────────────────────────────────────────────────────────────────

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

function parseIdeas(text: string): Idea[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSONが見つかりませんでした");
  const repaired = jsonMatch[0].replace(/,(\s*[}\]])/g, "$1");
  const parsed = JSON.parse(repaired) as { ideas: Idea[] };
  if (!Array.isArray(parsed.ideas)) throw new Error("ideasが配列ではありません");
  return parsed.ideas;
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { mood, theme, condition, audience, profile, feedback, youtubeData, trendingData } = (await request.json()) as {
      mood: string;
      theme?: string;
      condition?: string;
      audience?: string;
      profile: Profile;
      feedback: FeedbackStore;
      youtubeData?: YoutubeChannelData | null;
      trendingData?: TrendingData | null;
    };

    if (!mood || !profile) {
      return Response.json({ error: "リクエストが不正です" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const whitelisted = (process.env.WHITELISTED_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const isDev = process.env.NODE_ENV === "development";
    const isOwner = isDev || whitelisted.includes(ip);

    if (!isOwner) {
      const key = `caeruai:generate:${ip}`;
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

    const safeFeedback: FeedbackStore = feedback ?? { liked: [], disliked: [] };
    const platform = getPlatform(profile.platform);

    // ── Stage 1: ドラフト生成 ────────────────────────────────────────────────
    console.log("[generate] stage1: drafting");
    const userPrompt = buildUserPrompt(mood, theme ?? "", condition ?? "", audience ?? "", profile, safeFeedback, youtubeData, trendingData);

    let stage1Text = "";
    try {
      stage1Text = await callAI(isOwner, SYSTEM_PROMPT, userPrompt);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      stage1Text = await callAI(isOwner, SYSTEM_PROMPT, userPrompt);
    }

    const draftIdeas = parseIdeas(stage1Text);
    console.log("[generate] stage1: got", draftIdeas.length, "drafts");

    // ── Stage 2: 批評・改善 ──────────────────────────────────────────────────
    console.log("[generate] stage2: critiquing");
    const critiquePrompt = buildCritiquePrompt(draftIdeas, profile, safeFeedback, platform);

    let finalIdeas = draftIdeas;
    try {
      const stage2Text = await callAI(isOwner, CRITIQUE_SYSTEM_PROMPT, critiquePrompt);
      const refined = parseIdeas(stage2Text);
      if (refined.length === 5) {
        finalIdeas = refined;
        console.log("[generate] stage2: refined successfully");
      } else {
        console.warn("[generate] stage2: unexpected count, using draft");
      }
    } catch (e) {
      // Stage 2が失敗してもStage 1の結果を返す（品質より可用性を優先）
      console.warn("[generate] stage2 failed, using draft:", e instanceof Error ? e.message : e);
    }

    return Response.json({ ideas: finalIdeas });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", message);
    return Response.json({ error: `エラー: ${message}` }, { status: 500 });
  }
}
