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
    id: "motivation",
    question: "なぜコンテンツを作るの？",
    subtitle: "一番近いものを選んでください",
    type: "select",
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
    question: "視聴者との理想の関係は？",
    subtitle: "自分のチャンネルのイメージに近いものを",
    type: "select",
    options: [
      "先生と生徒（教える立場）",
      "友達・仲間（対等）",
      "演者と観客（エンタメ届ける）",
      "同志（同じ道を歩む）",
    ],
  },
  {
    id: "coreTheme",
    question: "チャンネルの核となる「問い」を一言で",
    subtitle: "あなたが一生追いかけたいテーマや問いかけ",
    type: "text",
    placeholder: "例：「なぜ人は変われないのか」「最高の体験を追い求める」",
  },
  {
    id: "avoid",
    question: "絶対にやりたくないことは？",
    subtitle: "テーマ・スタイル・表現方法、何でもOK",
    type: "text",
    placeholder: "例：炎上狙い、政治系の話題、顔出し、長すぎる動画...",
  },
  {
    id: "reference",
    question: "参考にしているコンテンツ・人物は？",
    subtitle: "YouTube以外でも、本・映画・SNSなど何でも",
    type: "text",
    placeholder: "例：MKBHD、中田敦彦、Vox、村上春樹、スティーブ・ジョブズ...",
  },
  {
    id: "processingStyle",
    question: "新しいことを学んだ時、まず何をしたい？",
    subtitle: "自然な衝動に従って選んでください",
    type: "select",
    options: [
      "とにかく深く調べる",
      "誰かに話したくなる",
      "すぐ自分で試してみる",
      "全体像を図にまとめたくなる",
    ],
  },
  {
    id: "creatorIdentity",
    question: "自分は本質的に何者だと思う？",
    subtitle: "コンテンツ抜きで、あなたの本質を選んでください",
    type: "select",
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
    const next = vals.includes(opt) ? vals.filter((v) => v !== opt) : [...vals, opt];
    setAnswers((a) => ({ ...a, [current.id]: next.join(SEPARATOR) }));
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const vals = value ? value.split(SEPARATOR) : [];
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
      motivation: answers.motivation ?? "",
      bestComment: answers.bestComment ?? "",
      creativeTriger: fmt(answers.creativeTriger ?? ""),
      audienceRelation: answers.audienceRelation ?? "",
      coreTheme: answers.coreTheme ?? "",
      avoid: answers.avoid ?? "",
      reference: answers.reference ?? "",
      processingStyle: answers.processingStyle ?? "",
      creatorIdentity: answers.creatorIdentity ?? "",
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
          <h2 className="text-xl font-bold text-white mb-1">{current.question}</h2>
          <p className="text-zinc-500 text-sm mb-6">{current.subtitle}</p>

          {current.type === "text" ? (
            <textarea
              value={value}
              onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && canNext() && next()}
              placeholder={current.placeholder}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
              autoFocus
            />
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                {current.options?.map((opt) => {
                  const active = current.type === "multiselect" ? isSelected(opt) : value === opt;
                  const label = current.id === "platform"
                    ? (PLATFORMS.find((p) => p.id === opt)?.label ?? opt)
                    : opt;
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        current.type === "multiselect"
                          ? toggleMulti(opt)
                          : setAnswers((a) => ({ ...a, [current.id]: a[current.id] === opt ? "" : opt }))
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
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
                <div className="flex gap-2 mt-3">
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
              className="flex items-center gap-2 px-6 py-4 rounded-xl font-medium text-sm text-zinc-400 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer"
            >
              <IconArrowLeft size={16} />
              戻る
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext()}
            className="flex-1 py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white flex items-center justify-center gap-2"
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
