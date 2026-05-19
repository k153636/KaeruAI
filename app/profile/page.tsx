"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/profile";
import { syncPush } from "@/lib/sync";
import { PLATFORMS } from "@/lib/platforms";
import { IconArrowLeft, IconEdit, IconCheck } from "@/components/icons";
import BottomNav from "@/components/BottomNav";

const SEPARATOR = "|||";

const FIELDS: {
  id: keyof Profile;
  label: string;
  type: "text" | "select" | "multiselect";
  options?: string[];
  optionLabels?: Record<string, string>;
  maxSelect?: number;
  placeholder?: string;
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
    label: "発信ジャンル・テーマ",
    type: "text",
    placeholder: "例：Roblox開発、料理、プログラミング、ファッション、筋トレ",
  },
  {
    id: "youtubeChannelUrl",
    label: "YouTubeチャンネルURL",
    type: "text",
    placeholder: "例：https://www.youtube.com/@あなたのチャンネル",
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
  {
    id: "hobby",
    label: "趣味・日常で熱中していること",
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
    label: "人より詳しいこと・得意なスキル",
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
    label: "1年後の理想の状態",
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

  function addCustom(type: "select" | "multiselect", maxSelect?: number) {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (type === "select") {
      setDraft(trimmed);
    } else {
      const vals = draft ? draft.split(SEPARATOR) : [];
      if (maxSelect && vals.length >= maxSelect) return;
      if (!vals.includes(trimmed)) setDraft([...vals, trimmed].join(SEPARATOR));
    }
    setCustomInput("");
  }

  function save() {
    if (!profile || !editingId) return;
    const updated = { ...profile, [editingId]: draft };
    setProfile(updated);
    saveProfile(updated);
    syncPush();
    setEditingId(null);
    setCustomInput("");
  }

  if (!profile) return null;

  const editingField = FIELDS.find((f) => f.id === editingId);

  return (
    <>
    <div className="min-h-screen bg-zinc-950 px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white font-semibold text-xl tracking-tight">プロフィール</h1>
          <button
            onClick={() => router.push("/main")}
            className="hidden sm:flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer"
          >
            <IconArrowLeft size={16} />
            戻る
          </button>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.09)" }}>
          {FIELDS.map((field, index) => {
            const isEditing = editingId === field.id;
            const raw = profile[field.id] ?? "";
            const isLast = index === FIELDS.length - 1;

            return (
              <div
                key={field.id}
                className="px-5 py-4"
                style={!isLast ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/35 mb-1 font-medium">{field.label}</p>
                    {!isEditing && (
                      <p className="text-sm text-white/80 leading-relaxed">
                        {displayValue(field, raw)}
                      </p>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(field)}
                      className="text-xs text-white/35 hover:text-white/60 transition-colors cursor-pointer shrink-0 mt-1"
                    >
                      変更
                    </button>
                  )}
                </div>

                {isEditing && editingField && (
                  <div className="mt-3">
                    {editingField.type === "text" ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        autoFocus
                        placeholder={editingField.placeholder}
                        className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none transition-colors resize-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 16 }}
                      />
                    ) : (
                      <div>
                        <div>
                          {editingField.maxSelect && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
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
                                  className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                    active ? "bg-white text-zinc-900" : "text-white/70 hover:text-white"
                                  }`}
                                  style={!active ? { border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" } : undefined}
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
                                  className="px-3 py-1.5 rounded-full text-sm bg-white text-zinc-900 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {custom}
                                  <span className="text-zinc-400 text-xs ml-0.5">×</span>
                                </button>
                              ))
                            }
                            {editingField.type === "select" && draft && !editingField.options?.includes(draft) && (
                              <button
                                onClick={() => setDraft("")}
                                className="px-3 py-1.5 rounded-full text-sm bg-white text-zinc-900 transition-all cursor-pointer flex items-center gap-1"
                              >
                                {draft}
                                <span className="text-zinc-400 text-xs ml-0.5">×</span>
                              </button>
                            )}
                          </div>
                          {(editingField.type === "multiselect" || editingField.type === "select") && (
                            <div className="mt-3">
                              <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { addCustom(editingField.type as "select" | "multiselect", editingField.maxSelect); (e.target as HTMLInputElement).blur(); } }}
                                onBlur={() => addCustom(editingField.type as "select" | "multiselect", editingField.maxSelect)}
                                placeholder="その他を入力..."
                                className="w-full rounded-2xl px-3 py-2 text-white placeholder-white/25 focus:outline-none transition-colors"
                                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 16 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={save}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-zinc-900 text-sm font-medium rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <IconCheck size={14} />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-white/50 text-sm hover:text-white/70 rounded-2xl transition-colors cursor-pointer"
                        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
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
    <BottomNav />
    </>
  );
}
