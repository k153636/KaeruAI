"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/profile";
import { PLATFORMS } from "@/lib/platforms";
import { IconArrowLeft, IconEdit, IconCheck } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

const SEPARATOR = "|||";

const FIELDS: {
  id: keyof Profile;
  label: string;
  type: "text" | "select" | "multiselect";
  options?: string[];
  optionLabels?: Record<string, string>;
  maxSelect?: number;
}[] = [
  {
    id: "platform",
    label: "メインプラットフォーム",
    type: "select",
    options: PLATFORMS.map((p) => p.id),
    optionLabels: Object.fromEntries(PLATFORMS.map((p) => [p.id, p.label])),
  },
  {
    id: "contentNiche",
    label: "ここへ来た目的",
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
    label: "なぜコンテンツを作るの？",
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
    label: "視聴者から一番嬉しいコメントは？",
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
    label: "動画を作りたくなる瞬間は？",
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
    label: "フォロワーとの理想の距離感",
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
    label: "一番刺さってほしい人",
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
    label: "コンテンツの一番の武器",
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
    label: "絶対にやりたくないこと",
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
    label: "面白いものを見つけた時、最初にしたいこと",
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
    label: "自分は本質的に何者？",
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
    label: "チャンネルが成功したと感じる瞬間は？",
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

function displayValue(field: (typeof FIELDS)[0], raw: string): string {
  if (!raw) return "未設定";
  if (field.type === "multiselect") return raw.split(SEPARATOR).filter(Boolean).join("、");
  if (field.optionLabels) return field.optionLabels[raw] ?? raw;
  return raw;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingId, setEditingId] = useState<keyof Profile | null>(null);
  const [draft, setDraft] = useState("");
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (!p) { router.replace("/setup"); return; }
    setProfile(p);
  }, [router]);

  function startEdit(field: (typeof FIELDS)[0]) {
    if (!profile) return;
    setEditingId(field.id);
    setDraft(profile[field.id] ?? "");
    setCustomInput("");
  }

  function toggleMulti(opt: string, maxSelect?: number) {
    const vals = draft ? draft.split(SEPARATOR) : [];
    if (vals.includes(opt)) {
      setDraft(vals.filter((v) => v !== opt).join(SEPARATOR));
    } else {
      if (maxSelect && vals.length >= maxSelect) return;
      setDraft([...vals, opt].join(SEPARATOR));
    }
  }

  function addCustom(maxSelect?: number) {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const vals = draft ? draft.split(SEPARATOR) : [];
    if (maxSelect && vals.length >= maxSelect) return;
    if (!vals.includes(trimmed)) setDraft([...vals, trimmed].join(SEPARATOR));
    setCustomInput("");
  }

  function save() {
    if (!profile || !editingId) return;
    const updated = { ...profile, [editingId]: draft };
    setProfile(updated);
    saveProfile(updated);
    setEditingId(null);
    setCustomInput("");
  }

  if (!profile) return null;

  const editingField = FIELDS.find((f) => f.id === editingId);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-zinc-900 font-bold text-xl">プロフィール編集</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle size={15} />
            <button
              onClick={() => router.push("/main")}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <IconArrowLeft size={16} />
              戻る
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {FIELDS.map((field) => {
            const isEditing = editingId === field.id;
            const raw = profile[field.id] ?? "";

            return (
              <div
                key={field.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400 mb-1">{field.label}</p>
                    {!isEditing && (
                      <p className="text-sm text-zinc-900 leading-relaxed">
                        {displayValue(field, raw)}
                      </p>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(field)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 mt-1"
                    >
                      <IconEdit size={13} />
                      変更
                    </button>
                  )}
                </div>

                {isEditing && editingField && (
                  <div className="mt-4">
                    {editingField.type === "text" ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        autoFocus
                        className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
                      />
                    ) : (
                      <div>
                        <div>
                          {editingField.maxSelect && (
                            <p className="text-xs text-zinc-400 mb-2">
                              {draft.split(SEPARATOR).filter(Boolean).length} / {editingField.maxSelect}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {editingField.options?.map((opt) => {
                              const active =
                                editingField.type === "multiselect"
                                  ? draft.split(SEPARATOR).includes(opt)
                                  : draft === opt;
                              const label = editingField.optionLabels?.[opt] ?? opt;
                              const selectedCount = draft.split(SEPARATOR).filter(Boolean).length;
                              const atLimit = !!editingField.maxSelect && selectedCount >= editingField.maxSelect && !active;
                              return (
                                <button
                                  key={opt}
                                  onClick={() =>
                                    editingField.type === "multiselect"
                                      ? toggleMulti(opt, editingField.maxSelect)
                                      : setDraft(draft === opt ? "" : opt)
                                  }
                                  disabled={atLimit}
                                  className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                    active
                                      ? "bg-red-500 border-red-500 text-white"
                                      : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                            {editingField.type === "multiselect" &&
                              draft.split(SEPARATOR).filter((v) => v && !editingField.options?.includes(v)).map((custom) => (
                                <button
                                  key={custom}
                                  onClick={() => toggleMulti(custom, editingField.maxSelect)}
                                  className="px-3 py-1.5 rounded-full text-sm border bg-red-500 border-red-500 text-white transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {custom}
                                  <span className="text-red-200 text-xs ml-0.5">×</span>
                                </button>
                              ))
                            }
                          </div>
                          {editingField.type === "multiselect" && (
                            <div className="flex gap-2 mt-3">
                              <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCustom(editingField.maxSelect)}
                                placeholder="その他を入力して追加..."
                                className="flex-1 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors text-sm"
                              />
                              <button
                                onClick={() => addCustom(editingField.maxSelect)}
                                disabled={!customInput.trim()}
                                className="px-3 py-2 rounded-xl text-sm font-medium bg-zinc-200 hover:bg-zinc-300 text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                追加
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={save}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        <IconCheck size={14} />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-zinc-500 text-sm border border-zinc-200 hover:border-zinc-400 rounded-xl transition-colors cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
