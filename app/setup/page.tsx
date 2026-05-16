"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

const STEPS = [
  {
    id: "genre",
    question: "チャンネルのジャンルは？",
    subtitle: "メインで扱っているコンテンツを選んでください",
    options: [
      "ゲーム実況",
      "Vlog・日常",
      "料理・グルメ",
      "ビジネス・自己啓発",
      "テック・ガジェット",
      "エンタメ・バラエティ",
      "教育・解説",
      "スポーツ・フィットネス",
      "美容・ファッション",
      "旅行・アウトドア",
    ],
  },
  {
    id: "style",
    question: "好きな動画スタイルは？",
    subtitle: "自分のチャンネルに合うスタイルを選んでください",
    options: [
      "テンポ速め・エネルギッシュ",
      "じっくり・丁寧に解説",
      "笑いあり・エンタメ系",
      "感動・ストーリー系",
      "情報密度高め・知識系",
      "リアル・ドキュメンタリー系",
      "短くサクッと完結",
      "長尺でじっくり",
    ],
  },
  {
    id: "avoid",
    question: "避けたいテーマは？",
    subtitle: "扱いたくないジャンルがあれば選んでください（複数可）",
    options: [
      "政治・社会問題",
      "炎上・対立系",
      "お金・投資",
      "恋愛・出会い",
      "ホラー・怖い話",
      "暴力・過激な表現",
      "特になし",
    ],
    multi: true,
  },
  {
    id: "audience",
    question: "メインのターゲット視聴者は？",
    subtitle: "どんな人に見てほしいですか？",
    options: [
      "10代（学生）",
      "20代（社会人・学生）",
      "30〜40代（社会人）",
      "主婦・主夫",
      "ビジネスパーソン",
      "趣味人・マニア",
      "幅広くみんなに",
    ],
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const current = STEPS[step];
  const isMulti = current.multi === true;
  const selected = answers[current.id];

  function toggle(option: string) {
    if (isMulti) {
      const cur = (answers[current.id] as string[] | undefined) ?? [];
      const next = cur.includes(option)
        ? cur.filter((v) => v !== option)
        : [...cur, option];
      setAnswers((a) => ({ ...a, [current.id]: next }));
    } else {
      setAnswers((a) => ({ ...a, [current.id]: option }));
    }
  }

  function isSelected(option: string) {
    if (isMulti) {
      return ((selected as string[] | undefined) ?? []).includes(option);
    }
    return selected === option;
  }

  function canNext() {
    if (isMulti) return true;
    return !!selected;
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      const profile: Profile = {
        genre: answers.genre as string,
        style: answers.style as string,
        avoid: Array.isArray(answers.avoid)
          ? (answers.avoid as string[]).join("、")
          : "特になし",
        audience: answers.audience as string,
      };
      localStorage.setItem("yt_profile", JSON.stringify(profile));
      router.push("/main");
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-red-500 font-bold text-lg mb-2">
            <span className="text-2xl">🎬</span>
            <span>YouTuber企画メーカー</span>
          </div>
          <p className="text-zinc-500 text-sm">1分でセットアップ完了</p>
        </div>

        {/* Progress */}
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

        {/* Question card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-1">{current.question}</h2>
          <p className="text-zinc-500 text-sm mb-6">{current.subtitle}</p>

          <div className="flex flex-wrap gap-2">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                  isSelected(opt)
                    ? "bg-red-500 border-red-500 text-white"
                    : "bg-transparent border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {isMulti && (
            <p className="text-zinc-600 text-xs mt-4">
              ※ 複数選択可。選ばなくてもOK
            </p>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          disabled={!canNext()}
          className="w-full py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white"
        >
          {step < STEPS.length - 1 ? "次へ →" : "セットアップ完了 🎉"}
        </button>
      </div>
    </div>
  );
}
