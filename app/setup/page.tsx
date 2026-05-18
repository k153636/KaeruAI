"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Profile } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/profile";
import { PLATFORMS } from "@/lib/platforms";
import { IconCamera, IconArrowRight, IconArrowLeft, IconCheck } from "@/components/icons";
import FadeUp from "@/components/FadeUp";
import ThemeToggle from "@/components/ThemeToggle";

type StepType = "text" | "select" | "multiselect";

interface Step {
  id: keyof Profile;
  question: string;
  subtitle: string;
  type: StepType;
  placeholder?: string;
  options?: string[];
  maxSelect?: number;
}

const STEPS: Step[] = [
  {
    id: "platform",
    question: "メインで活動しているプラットフォームは？",
    subtitle: "最も力を入れているものを選んでください",
    type: "select",
    options: PLATFORMS.map((p) => p.id),
  },
  {
    id: "contentNiche",
    question: "なぜあなたはここへ来ましたか？",
    subtitle: "複数選択できます。目的に合わせて企画を最適化します",
    type: "multiselect",
    options: [
      "ネタ切れを解消したい",
      "バズる企画を量産したい",
      "チャンネルの方向性を固めたい",
      "継続して投稿できるようになりたい",
      "新しいジャンルに挑戦したい",
      "フォロワーを増やしたい",
      "収益化を目指したい",
      "自分らしい発信スタイルを見つけたい",
    ],
  },
  {
    id: "motivation",
    question: "なぜコンテンツを作るの？",
    subtitle: "最大2つ選べます",
    type: "multiselect",
    maxSelect: 2,
    options: [
      "お金・影響力を得たいから",
      "自分の考えや知識を広めたいから",
      "純粋に楽しい・自己表現したいから",
      "誰かの悩みを解決したいから",
      "認められたい・有名になりたいから",
    ],
  },
  {
    id: "bestComment",
    question: "視聴者から一番嬉しいコメントは？",
    subtitle: "正直に選んでください",
    type: "select",
    options: [
      "「すごくわかりやすかった」",
      "「笑えた、また来ます」",
      "「やってみます！」",
      "「元気もらえました」",
      "「ずっと応援してます」",
    ],
  },
  {
    id: "creativeTriger",
    question: "動画を作りたくなる瞬間は？",
    subtitle: "複数選択できます",
    type: "multiselect",
    options: [
      "怒りや違和感を感じた時",
      "感動・発見があった時",
      "誰かに教えたいことができた時",
      "面白い体験をした時",
    ],
  },
  {
    id: "audienceRelation",
    question: "フォロワーとの理想の距離感は？",
    subtitle: "あなたのチャンネルの空気感を決めます",
    type: "select",
    options: [
      "先生と生徒（信頼して学びに来る）",
      "友達・仲間（対等に楽しむ）",
      "演者と観客（非日常を届ける）",
      "同志（同じ目標に向かって歩む）",
    ],
  },
  {
    id: "targetAudience",
    question: "このコンテンツが一番刺さってほしい人は？",
    subtitle: "企画の「誰のため」を明確にします",
    type: "select",
    options: [
      "過去の自分と同じ悩みを抱えた人",
      "同じ熱量で楽しめる仲間",
      "これから始めようとしている初心者",
      "もっと上を目指している向上心のある人",
      "今の自分自身（自己表現・記録）",
    ],
  },
  {
    id: "contentApproach",
    question: "あなたのコンテンツが持つ一番の武器は？",
    subtitle: "企画の方向性の軸になります",
    type: "select",
    options: [
      "リアルな体験・失敗も含めたドキュメント",
      "わかりやすく噛み砕いた解説・教育",
      "一緒に楽しめるエンタメ・巻き込み力",
      "深く共感できる感情・ストーリー",
      "意外性・驚き・新しい視点",
    ],
  },
  {
    id: "avoid",
    question: "絶対にやりたくないことは？",
    subtitle: "選んだ内容はAIが企画から除外します",
    type: "multiselect",
    options: [
      "炎上・煽りを狙ったコンテンツ",
      "政治・宗教・思想系の話題",
      "顔出し",
      "20分を超える長尺",
      "企業案件・広告感の強い内容",
      "ネガティブ・暗い雰囲気",
      "過激・センセーショナルな表現",
      "特定の誰かを批判・攻撃する内容",
    ],
  },
  {
    id: "processingStyle",
    question: "何か面白いものを見つけた時、最初にしたいことは？",
    subtitle: "あなたの情報処理の癖が企画スタイルに直結します",
    type: "select",
    options: [
      "とことん深く調べたくなる",
      "すぐ誰かに話したくなる",
      "とにかく自分でやってみたくなる",
      "全体を整理して図にまとめたくなる",
    ],
  },
  {
    id: "creatorIdentity",
    question: "自分は本質的に何者だと思う？",
    subtitle: "最大2つ選べます",
    type: "multiselect",
    maxSelect: 2,
    options: [
      "教える人（ティーチャー）",
      "楽しませる人（エンターテイナー）",
      "探求する人（エクスプローラー）",
      "語る人（ストーリーテラー）",
      "批評・分析する人（クリティック）",
      "実験する人（イノベーター）",
    ],
  },
  {
    id: "successDefinition",
    question: "チャンネルが成功したと感じる瞬間は？",
    subtitle: "あなたにとっての「ゴール」を選んでください",
    type: "select",
    options: [
      "「あの動画で人生変わりました」と言われる",
      "収益だけで生活できる",
      "専門家として認められる",
      "ファンが熱狂的に応援してくれる",
      "心から楽しみながら続けられている",
    ],
  },
  {
    id: "hobby",
    question: "趣味や日常で熱中していることは？",
    subtitle: "コンテンツのネタ源になります。複数選べます",
    type: "multiselect",
    options: [
      "音楽・楽器",
      "料理・グルメ",
      "スポーツ・フィットネス",
      "ゲーム",
      "読書・映画・アニメ",
      "旅行・アウトドア",
      "アート・デザイン",
      "テクノロジー・プログラミング",
      "ファッション・美容",
      "ビジネス・投資",
    ],
  },
  {
    id: "expertise",
    question: "人より詳しいこと・得意なスキルは？",
    subtitle: "コンテンツの差別化ポイントになります。複数選べます",
    type: "multiselect",
    options: [
      "特定の専門知識・資格がある",
      "実体験・失敗談が豊富",
      "わかりやすく説明するのが得意",
      "トレンドを早くキャッチする",
      "独自の視点・分析力がある",
      "コミュニティ作りが得意",
      "編集・映像制作スキルがある",
      "文章を書くのが得意",
    ],
  },
  {
    id: "dreamGoal",
    question: "1年後、チャンネルがどんな状態なら最高？",
    subtitle: "今の企画の方向性を決めます",
    type: "select",
    options: [
      "月10万円以上の収益がある",
      "フォロワー・登録者が1万人を超えている",
      "憧れのクリエイターとコラボしている",
      "自分のスキルで誰かの人生が変わった",
      "本業を超える影響力を持っている",
      "純粋に楽しみながら続けられている",
    ],
  },
];

const REQUIRED_STEPS = 2;
const SEPARATOR = "|||";

type Phase = "required" | "interstitial" | "optional";

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("required");
  const [fromMain, setFromMain] = useState(false);
  const [answers, setAnswers] = useState<Partial<Record<keyof Profile, string>>>({});

  useEffect(() => {
    if (searchParams.get("continue") === "true") {
      const existing = loadProfile();
      if (existing) {
        const sep = "|||";
        const toRaw = (v: string | undefined) => v ? v.split("、").join(sep) : "";
        setAnswers({
          platform: existing.platform,
          contentNiche: toRaw(existing.contentNiche),
          motivation: toRaw(existing.motivation),
          bestComment: existing.bestComment ?? "",
          creativeTriger: toRaw(existing.creativeTriger),
          audienceRelation: existing.audienceRelation ?? "",
          targetAudience: existing.targetAudience ?? "",
          contentApproach: existing.contentApproach ?? "",
          avoid: toRaw(existing.avoid),
          processingStyle: existing.processingStyle ?? "",
          creatorIdentity: toRaw(existing.creatorIdentity),
          successDefinition: existing.successDefinition ?? "",
          hobby: toRaw(existing.hobby),
          expertise: toRaw(existing.expertise),
          dreamGoal: existing.dreamGoal ?? "",
        });
      }
      setFromMain(true);
      setPhase("optional");
      const firstUnanswered = STEPS.findIndex(
        (s, i) => i >= REQUIRED_STEPS && !existing?.[s.id]
      );
      setStep(firstUnanswered !== -1 ? firstUnanswered : REQUIRED_STEPS);
    }
  }, [searchParams]);
  const [customInput, setCustomInput] = useState("");

  const current = STEPS[step];
  const value = answers[current?.id] ?? "";

  function toggleMulti(opt: string) {
    const vals = value ? value.split(SEPARATOR) : [];
    if (vals.includes(opt)) {
      setAnswers((a) => ({ ...a, [current.id]: vals.filter((v) => v !== opt).join(SEPARATOR) }));
    } else {
      if (current.maxSelect && vals.length >= current.maxSelect) return;
      setAnswers((a) => ({ ...a, [current.id]: [...vals, opt].join(SEPARATOR) }));
    }
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (current.type === "select") {
      setAnswers((a) => ({ ...a, [current.id]: trimmed }));
    } else {
      const vals = value ? value.split(SEPARATOR) : [];
      if (current.maxSelect && vals.length >= current.maxSelect) return;
      if (!vals.includes(trimmed)) {
        setAnswers((a) => ({ ...a, [current.id]: [...vals, trimmed].join(SEPARATOR) }));
      }
    }
    setCustomInput("");
  }

  function isSelected(opt: string) {
    return value.split(SEPARATOR).includes(opt);
  }

  function goStep(n: number) {
    setCustomInput("");
    setStep(n);
  }

  function canNext() {
    if (current.type === "multiselect") return value.length > 0;
    if (current.type === "select") return !!value;
    return value.trim().length > 0;
  }

  function buildProfile(): Profile {
    const fmt = (v: string) => v.split(SEPARATOR).filter(Boolean).join("、");
    return {
      platform: answers.platform ?? "youtube",
      contentNiche: fmt(answers.contentNiche ?? ""),
      motivation: answers.motivation ? fmt(answers.motivation) : undefined,
      bestComment: answers.bestComment || undefined,
      creativeTriger: answers.creativeTriger ? fmt(answers.creativeTriger) : undefined,
      audienceRelation: answers.audienceRelation || undefined,
      targetAudience: answers.targetAudience || undefined,
      contentApproach: answers.contentApproach || undefined,
      avoid: answers.avoid ? fmt(answers.avoid) : undefined,
      processingStyle: answers.processingStyle || undefined,
      creatorIdentity: answers.creatorIdentity ? fmt(answers.creatorIdentity) : undefined,
      successDefinition: answers.successDefinition || undefined,
      hobby: answers.hobby ? fmt(answers.hobby) : undefined,
      expertise: answers.expertise ? fmt(answers.expertise) : undefined,
      dreamGoal: answers.dreamGoal || undefined,
    };
  }

  function finishSetup() {
    saveProfile(buildProfile());
    router.push("/main");
  }

  function next() {
    if (step + 1 === REQUIRED_STEPS && phase === "required") {
      saveProfile(buildProfile());
      setPhase("interstitial");
      return;
    }

    if (phase === "optional") {
      const updated = buildProfile();
      saveProfile(updated);

      if (fromMain) {
        const nextUnanswered = STEPS.findIndex(
          (s, i) => i > step && i >= REQUIRED_STEPS && !answers[s.id]
        );
        if (nextUnanswered !== -1) {
          goStep(nextUnanswered);
        } else {
          router.push("/main");
        }
        return;
      }
    }

    const nextStep = step + 1;
    if (nextStep >= STEPS.length) {
      finishSetup();
      return;
    }
    goStep(nextStep);
  }

  function continueOptional() {
    setPhase("optional");
    goStep(REQUIRED_STEPS);
  }

  function exitToMain() {
    saveProfile(buildProfile());
    router.push("/main");
  }

  const isOptionalPhase = phase === "optional";
  const optionalTotal = STEPS.length - REQUIRED_STEPS;
  const optionalAnswered = STEPS.filter(
    (s, i) => i >= REQUIRED_STEPS && !!answers[s.id]
  ).length;
  const progress = phase === "required"
    ? ((step + 1) / REQUIRED_STEPS) * 100
    : (optionalAnswered / optionalTotal) * 100;

  // 中間画面
  if (phase === "interstitial") {
    return (
      <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-12 pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-lg">
          <FadeUp delay={0} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-lg mb-6">
              <IconCamera size={22} />
              <span>KaeruAI</span>
            </div>
            <div className="text-4xl mb-4">✦</div>
            <h2 className="text-zinc-900 dark:text-white font-bold text-2xl mb-3">
              まず使ってみましょう！
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              あと10問答えると、あなたにしか作れない企画が生まれます。<br />
              続ける？それともあとで？
            </p>
          </FadeUp>

          <FadeUp delay={120} className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">回答すると精度が上がる項目</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">残り10問</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["クリエイター像", "届けたい人", "コンテンツの武器", "作る理由", "NGこと", "距離感", "他5問"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-900 dark:text-white">
                  {tag}
                </span>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={200} className="flex flex-col gap-3">
            <button
              onClick={continueOptional}
              className="w-full py-4 rounded-2xl font-bold text-base bg-zinc-900 dark:bg-white hover:opacity-80 text-white dark:text-zinc-900 flex items-center justify-center gap-2 transition-opacity cursor-pointer"
            >
              <span>続けて答える</span>
              <IconArrowRight size={18} />
            </button>
            <button
              onClick={exitToMain}
              className="w-full py-3 rounded-2xl text-sm text-zinc-900 dark:text-white border border-zinc-900 dark:border-white hover:opacity-60 transition-opacity cursor-pointer"
            >
              あとで答える（企画生成へ）
            </button>
          </FadeUp>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-12 pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center relative">
          <div className="absolute right-0 top-0 flex items-center gap-2">
            {isOptionalPhase && (
              <button
                onClick={exitToMain}
                className="text-zinc-900 dark:text-white hover:opacity-60 transition-opacity cursor-pointer p-1 text-lg leading-none"
                aria-label="終了して企画生成へ"
              >
                ✕
              </button>
            )}
            <ThemeToggle size={15} />
          </div>
          <div className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-lg mb-2">
            <IconCamera size={22} />
            <span>KaeruAI</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {isOptionalPhase ? "答えるほど精度が上がります" : "あなたのことを教えてください"}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <span>
              {isOptionalPhase
                ? `${optionalAnswered} / ${optionalTotal} 回答済み`
                : `STEP ${step + 1} / ${REQUIRED_STEPS}`}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <FadeUp key={step} delay={0} className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{current.question}</h2>
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{current.subtitle}</p>
            {current.maxSelect && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {value ? value.split(SEPARATOR).filter(Boolean).length : 0} / {current.maxSelect}
              </span>
            )}
          </div>

          {current.type === "text" ? (
            <textarea
              value={value}
              onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && canNext() && next()}
              placeholder={current.placeholder}
              rows={3}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-400 transition-colors text-base resize-none"
              autoFocus
            />
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                {current.options?.map((opt, i) => {
                  const active = current.type === "multiselect" ? isSelected(opt) : value === opt;
                  const label = current.id === "platform"
                    ? (PLATFORMS.find((p) => p.id === opt)?.label ?? opt)
                    : opt;
                  const selectedCount = value ? value.split(SEPARATOR).filter(Boolean).length : 0;
                  const atLimit = !!current.maxSelect && selectedCount >= current.maxSelect && !active;
                  return (
                    <FadeUp
                      key={opt}
                      as="button"
                      triggerKey={step}
                      delay={100 + i * 50}
                      onClick={() =>
                        current.type === "multiselect"
                          ? toggleMulti(opt)
                          : setAnswers((a) => ({ ...a, [current.id]: a[current.id] === opt ? "" : opt }))
                      }
                      disabled={atLimit}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        active
                          ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900"
                          : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white hover:opacity-70"
                      }`}
                    >
                      {label}
                    </FadeUp>
                  );
                })}
                {current.type === "multiselect" &&
                  value.split(SEPARATOR).filter((v) => v && !current.options?.includes(v)).map((custom) => (
                    <button
                      key={custom}
                      onClick={() => toggleMulti(custom)}
                      className="px-4 py-2 rounded-full text-sm font-medium border bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 transition-all cursor-pointer flex items-center gap-1"
                    >
                      {custom}
                      <span className="text-white/60 dark:text-zinc-900/60 text-xs ml-0.5">×</span>
                    </button>
                  ))
                }
                {current.type === "select" && value && !current.options?.includes(value) && (
                  <button
                    onClick={() => setAnswers((a) => ({ ...a, [current.id]: "" }))}
                    className="px-4 py-2 rounded-full text-sm font-medium border bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 transition-all cursor-pointer flex items-center gap-1"
                  >
                    {value}
                    <span className="text-white/60 dark:text-zinc-900/60 text-xs ml-0.5">×</span>
                  </button>
                )}
              </div>
              {(current.type === "multiselect" || current.type === "select") && (
                <FadeUp triggerKey={step} delay={300} className="mt-3">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addCustom(); (e.target as HTMLInputElement).blur(); } }}
                    onBlur={addCustom}
                    placeholder="その他を入力...（入力後、画面を触れば確定）"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-2xl px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-400 transition-colors text-base"
                  />
                </FadeUp>
              )}
            </div>
          )}
        </FadeUp>

        <div className="flex gap-3">
          {step > 0 && (
            <FadeUp
              as="button"
              triggerKey={step}
              delay={80}
              onClick={() => {
                if (step === REQUIRED_STEPS && isOptionalPhase) {
                  fromMain ? exitToMain() : setPhase("interstitial");
                } else {
                  goStep(step - 1);
                }
              }}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-medium text-sm text-zinc-900 dark:text-white border border-zinc-900 dark:border-white hover:opacity-60 transition-opacity cursor-pointer"
            >
              <IconArrowLeft size={16} />
              戻る
            </FadeUp>
          )}
          <FadeUp key={step} delay={130} className="flex-1">
            <button
              onClick={next}
              disabled={!canNext()}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-900 dark:bg-white hover:opacity-80 text-white dark:text-zinc-900 flex items-center justify-center gap-2"
            >
              {step < STEPS.length - 1 ? (
                <><span>次へ</span><IconArrowRight size={18} /></>
              ) : (
                <><IconCheck size={18} /><span>セットアップ完了</span></>
              )}
            </button>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
