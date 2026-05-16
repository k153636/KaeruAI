"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

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
    id: "genre",
    question: "どんな内容のチャンネルですか？",
    subtitle: "ジャンルや扱うテーマを自由に書いてください",
    type: "text",
    placeholder: "例：AIツール紹介、哲学系解説、筋トレ日記、ガジェットレビュー...",
  },
  {
    id: "strength",
    question: "チャンネルの一番の強みは何ですか？",
    subtitle: "他のチャンネルと違う点、自分が得意なことを教えてください",
    type: "text",
    placeholder: "例：専門知識をわかりやすく噛み砕く、圧倒的なリサーチ量、独自の視点...",
  },
  {
    id: "moodGoal",
    question: "視聴者にどんな気持ちになってほしいですか？",
    subtitle: "動画を見終わった後の感情。複数選択できます",
    type: "multiselect",
    options: [
      "「なるほど！」と学びを得た",
      "「やってみよう」と行動したくなった",
      "「面白かった」と笑えた",
      "「スッキリした」と癒された",
      "「怖い・衝撃的」と心が揺れた",
      "「共感した」と分かってもらえた",
      "「すごい」と純粋に感動した",
    ],
  },
  {
    id: "avoid",
    question: "絶対にやりたくないことは何ですか？",
    subtitle: "コンテンツの方向性・スタイル・テーマ、何でもOK",
    type: "text",
    placeholder: "例：炎上狙い、政治系の話題、長すぎる動画、顔出し...",
  },
  {
    id: "reference",
    question: "参考にしているチャンネルや好きなコンテンツは？",
    subtitle: "YouTubeに限らず、映画・本・SNSなど何でも",
    type: "text",
    placeholder: "例：MKBHD、中田敦彦のYouTube大学、Vox、NHKドキュメンタリー...",
  },
  {
    id: "tagline",
    question: "あなたのチャンネルを一言で表すと？",
    subtitle: "キャッチコピーでも、ひとつのキーワードでも",
    type: "text",
    placeholder: "例：「知的好奇心を刺激するチャンネル」「ゆるくて本質的」...",
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<keyof Profile, string>>>({});

  const current = STEPS[step];
  const value = answers[current.id] ?? "";

  function toggleMulti(opt: string) {
    const current_vals = value ? value.split("|||") : [];
    const next = current_vals.includes(opt)
      ? current_vals.filter((v) => v !== opt)
      : [...current_vals, opt];
    setAnswers((a) => ({ ...a, [current.id]: next.join("|||") }));
  }

  function isSelected(opt: string) {
    return value.split("|||").includes(opt);
  }

  function canNext() {
    if (current.type === "multiselect") return value.length > 0;
    if (current.type === "select") return !!value;
    return value.trim().length > 0;
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      const formatMulti = (val: string) =>
        val.split("|||").filter(Boolean).join("、");

      const profile: Profile = {
        genre: answers.genre ?? "",
        strength: answers.strength ?? "",
        moodGoal: formatMulti(answers.moodGoal ?? ""),
        avoid: answers.avoid ?? "",
        reference: answers.reference ?? "",
        tagline: answers.tagline ?? "",
      };
      localStorage.setItem("yt_profile", JSON.stringify(profile));
      router.push("/main");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canNext()) next();
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
          <p className="text-zinc-500 text-sm">チャンネルのことを教えてください</p>
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

          {current.type === "text" ? (
            <textarea
              value={value}
              onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder={current.placeholder}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
              autoFocus
            />
          ) : current.type === "multiselect" ? (
            <div className="flex flex-wrap gap-2">
              {current.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleMulti(opt)}
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {current.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [current.id]: opt }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                    value === opt
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-transparent border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-4 rounded-xl font-medium text-sm text-zinc-400 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer"
            >
              ← 戻る
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext()}
            className="flex-1 py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white"
          >
            {step < STEPS.length - 1 ? "次へ →" : "セットアップ完了 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}
