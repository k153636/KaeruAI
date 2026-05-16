"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { saveProfile } from "@/lib/profile";
import { PLATFORMS } from "@/lib/platforms";
import { IconCamera, IconArrowRight, IconArrowLeft, IconCheck } from "@/components/icons";

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
    question: "どんなジャンル・テーマで発信したい？",
    subtitle: "複数でもOK。具体的なほど精度が上がります",
    type: "multiselect",
    options: [
      "AI・テクノロジー",
      "ビジネス・副業",
      "ガジェット・レビュー",
      "ゲーム",
      "料理・グルメ",
      "旅行・Vlog",
      "ファッション・美容",
      "フィットネス・健康",
      "学習・自己啓発",
      "エンタメ・コメディ",
      "音楽・アート",
      "投資・お金",
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
];

const SEPARATOR = "|||";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<keyof Profile, string>>>({});
  const [customInput, setCustomInput] = useState("");

  const current = STEPS[step];
  const value = answers[current.id] ?? "";

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
    const vals = value ? value.split(SEPARATOR) : [];
    if (current.maxSelect && vals.length >= current.maxSelect) return;
    if (!vals.includes(trimmed)) {
      setAnswers((a) => ({ ...a, [current.id]: [...vals, trimmed].join(SEPARATOR) }));
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

  function next() {
    if (step < STEPS.length - 1) {
      goStep(step + 1);
      return;
    }

    const fmt = (v: string) => v.split(SEPARATOR).filter(Boolean).join("、");

    const profile: Profile = {
      platform: answers.platform ?? "youtube",
      contentNiche: fmt(answers.contentNiche ?? ""),
      motivation: fmt(answers.motivation ?? ""),
      bestComment: answers.bestComment ?? "",
      creativeTriger: fmt(answers.creativeTriger ?? ""),
      audienceRelation: answers.audienceRelation ?? "",
      targetAudience: answers.targetAudience ?? "",
      contentApproach: answers.contentApproach ?? "",
      avoid: fmt(answers.avoid ?? ""),
      processingStyle: answers.processingStyle ?? "",
      creatorIdentity: fmt(answers.creatorIdentity ?? ""),
      successDefinition: answers.successDefinition ?? "",
    };
    saveProfile(profile);
    router.push("/main");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-red-500 font-bold text-lg mb-2">
            <IconCamera size={22} />
            <span>KaeruAI</span>
          </div>
          <p className="text-zinc-500 text-sm">あなたのことを教えてください</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>STEP {step + 1} / {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 style={{ animationDelay: "0ms" }} className="stagger-item text-xl font-bold text-white mb-1">{current.question}</h2>
          <div style={{ animationDelay: "55ms" }} className="stagger-item flex items-center justify-between mb-6">
            <p className="text-zinc-500 text-sm">{current.subtitle}</p>
            {current.maxSelect && (
              <span className="text-xs text-zinc-600">
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
              style={{ animationDelay: "110ms" }}
              className="stagger-item w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
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
                    <button
                      key={opt}
                      onClick={() =>
                        current.type === "multiselect"
                          ? toggleMulti(opt)
                          : setAnswers((a) => ({ ...a, [current.id]: a[current.id] === opt ? "" : opt }))
                      }
                      disabled={atLimit}
                      style={{ animationDelay: `${(i + 2) * 55}ms` }}
                      className={`stagger-item px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        active
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-transparent border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                {current.type === "multiselect" &&
                  value.split(SEPARATOR).filter((v) => v && !current.options?.includes(v)).map((custom) => (
                    <button
                      key={custom}
                      onClick={() => toggleMulti(custom)}
                      className="px-4 py-2 rounded-full text-sm font-medium border bg-red-500 border-red-500 text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      {custom}
                      <span className="text-red-200 text-xs ml-0.5">×</span>
                    </button>
                  ))
                }
              </div>
              {current.type === "multiselect" && (
                <div style={{ animationDelay: `${((current.options?.length ?? 0) + 2) * 55}ms` }} className="stagger-item flex gap-2 mt-3">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustom()}
                    placeholder="その他を入力して追加..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
                  />
                  <button
                    onClick={addCustom}
                    disabled={!customInput.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    追加
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => goStep(step - 1)}
              style={{ animationDelay: `${((current.options?.length ?? 0) + 3) * 55}ms` }}
              className="stagger-item flex items-center gap-2 px-6 py-4 rounded-xl font-medium text-sm text-zinc-400 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
            >
              <IconArrowLeft size={16} />
              戻る
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext()}
            style={{ animationDelay: `${((current.options?.length ?? 0) + 3) * 55}ms` }}
            className="stagger-item flex-1 py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white flex items-center justify-center gap-2"
          >
            {step < STEPS.length - 1 ? (
              <><span>次へ</span><IconArrowRight size={18} /></>
            ) : (
              <><IconCheck size={18} /><span>セットアップ完了</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
