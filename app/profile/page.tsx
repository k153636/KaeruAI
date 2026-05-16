"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { IconArrowLeft, IconEdit, IconCheck } from "@/components/icons";

const SEPARATOR = "|||";

const FIELDS: {
  id: keyof Profile;
  label: string;
  type: "text" | "select" | "multiselect";
  options?: string[];
}[] = [
  {
    id: "motivation",
    label: "なぜ動画を作るの？",
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
    label: "視聴者との理想の関係は？",
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
    label: "チャンネルの核となる「問い」",
    type: "text",
  },
  {
    id: "avoid",
    label: "絶対にやりたくないことは？",
    type: "text",
  },
  {
    id: "reference",
    label: "参考にしているコンテンツ・人物",
    type: "text",
  },
  {
    id: "processingStyle",
    label: "新しいことを学んだ時、まず何をしたい？",
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
    label: "自分は本質的に何者？",
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
  return raw;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingId, setEditingId] = useState<keyof Profile | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("yt_profile");
    if (!raw) { router.replace("/setup"); return; }
    setProfile(JSON.parse(raw));
  }, [router]);

  function startEdit(field: (typeof FIELDS)[0]) {
    if (!profile) return;
    setEditingId(field.id);
    setDraft(profile[field.id] ?? "");
  }

  function toggleMulti(opt: string) {
    const vals = draft ? draft.split(SEPARATOR) : [];
    const next = vals.includes(opt) ? vals.filter((v) => v !== opt) : [...vals, opt];
    setDraft(next.join(SEPARATOR));
  }

  function save() {
    if (!profile || !editingId) return;
    const updated = { ...profile, [editingId]: draft };
    setProfile(updated);
    localStorage.setItem("yt_profile", JSON.stringify(updated));
    setEditingId(null);
  }

  if (!profile) return null;

  const editingField = FIELDS.find((f) => f.id === editingId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white font-bold text-xl">プロフィール編集</h1>
          <button
            onClick={() => router.push("/main")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <IconArrowLeft size={16} />
            戻る
          </button>
        </div>

        <div className="space-y-3">
          {FIELDS.map((field) => {
            const isEditing = editingId === field.id;
            const raw = profile[field.id] ?? "";

            return (
              <div
                key={field.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 mb-1">{field.label}</p>
                    {!isEditing && (
                      <p className="text-sm text-white leading-relaxed">
                        {displayValue(field, raw)}
                      </p>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(field)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 mt-1"
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
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-sm resize-none"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editingField.options?.map((opt) => {
                          const active =
                            editingField.type === "multiselect"
                              ? draft.split(SEPARATOR).includes(opt)
                              : draft === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() =>
                                editingField.type === "multiselect"
                                  ? toggleMulti(opt)
                                  : setDraft(opt)
                              }
                              className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
                                active
                                  ? "bg-red-500 border-red-500 text-white"
                                  : "bg-transparent border-zinc-700 text-zinc-300 hover:border-zinc-500"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
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
                        className="px-4 py-2 text-zinc-400 text-sm border border-zinc-700 hover:border-zinc-500 rounded-xl transition-colors cursor-pointer"
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
