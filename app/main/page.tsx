"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/profile";
import { getFeedback, getFeedbackState, addLiked, addDisliked, removeFeedback } from "@/lib/feedback";
import { addHistory } from "@/lib/history";
import { IconCamera, IconThumbUp, IconThumbDown, IconSparkle, IconUser, IconLoader } from "@/components/icons";
import { getPlatform } from "@/lib/platforms";
import FadeUp from "@/components/FadeUp";
import ThemeToggle from "@/components/ThemeToggle";
import type { Idea } from "@/lib/types";

function IconCopy({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconFilm({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconImage({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 精度向上サジェスト定義（表示優先順）
const SEPARATOR = "|||";

interface SuggestionField {
  id: keyof Profile;
  question: string;
  subtitle: string;
  type: "select" | "multiselect";
  options: string[];
  maxSelect?: number;
}

const SUGGESTION_FIELDS: SuggestionField[] = [
  {
    id: "creatorIdentity",
    question: "自分は本質的に何者だと思う？",
    subtitle: "最大2つ選べます",
    type: "multiselect",
    maxSelect: 2,
    options: ["教える人（ティーチャー）", "楽しませる人（エンターテイナー）", "探求する人（エクスプローラー）", "語る人（ストーリーテラー）", "批評・分析する人（クリティック）", "実験する人（イノベーター）"],
  },
  {
    id: "targetAudience",
    question: "一番刺さってほしい人は？",
    subtitle: "企画の「誰のため」を明確にします",
    type: "select",
    options: ["過去の自分と同じ悩みを抱えた人", "同じ熱量で楽しめる仲間", "これから始めようとしている初心者", "もっと上を目指している向上心のある人", "今の自分自身（自己表現・記録）"],
  },
  {
    id: "contentApproach",
    question: "コンテンツの一番の武器は？",
    subtitle: "企画の方向性の軸になります",
    type: "select",
    options: ["リアルな体験・失敗も含めたドキュメント", "わかりやすく噛み砕いた解説・教育", "一緒に楽しめるエンタメ・巻き込み力", "深く共感できる感情・ストーリー", "意外性・驚き・新しい視点"],
  },
  {
    id: "motivation",
    question: "なぜコンテンツを作るの？",
    subtitle: "最大2つ選べます",
    type: "multiselect",
    maxSelect: 2,
    options: ["お金・影響力を得たいから", "自分の考えや知識を広めたいから", "純粋に楽しい・自己表現したいから", "誰かの悩みを解決したいから", "認められたい・有名になりたいから"],
  },
  {
    id: "avoid",
    question: "絶対にやりたくないことは？",
    subtitle: "AIが企画から除外します",
    type: "multiselect",
    options: ["炎上・煽りを狙ったコンテンツ", "政治・宗教・思想系の話題", "顔出し", "20分を超える長尺", "企業案件・広告感の強い内容", "ネガティブ・暗い雰囲気", "過激・センセーショナルな表現", "特定の誰かを批判・攻撃する内容"],
  },
  {
    id: "audienceRelation",
    question: "フォロワーとの理想の距離感は？",
    subtitle: "チャンネルの空気感を決めます",
    type: "select",
    options: ["先生と生徒（信頼して学びに来る）", "友達・仲間（対等に楽しむ）", "演者と観客（非日常を届ける）", "同志（同じ目標に向かって歩む）"],
  },
  {
    id: "bestComment",
    question: "視聴者から一番嬉しいコメントは？",
    subtitle: "正直に選んでください",
    type: "select",
    options: ["「すごくわかりやすかった」", "「笑えた、また来ます」", "「やってみます！」", "「元気もらえました」", "「ずっと応援してます」"],
  },
  {
    id: "creativeTriger",
    question: "動画を作りたくなる瞬間は？",
    subtitle: "複数選択できます",
    type: "multiselect",
    options: ["怒りや違和感を感じた時", "感動・発見があった時", "誰かに教えたいことができた時", "面白い体験をした時"],
  },
  {
    id: "processingStyle",
    question: "面白いものを見つけた時、最初にしたいことは？",
    subtitle: "あなたの情報処理スタイル",
    type: "select",
    options: ["とことん深く調べたくなる", "すぐ誰かに話したくなる", "とにかく自分でやってみたくなる", "全体を整理して図にまとめたくなる"],
  },
  {
    id: "successDefinition",
    question: "チャンネルが成功したと感じる瞬間は？",
    subtitle: "あなたにとっての「ゴール」",
    type: "select",
    options: ["「あの動画で人生変わりました」と言われる", "収益だけで生活できる", "専門家として認められる", "ファンが熱狂的に応援してくれる", "心から楽しみながら続けられている"],
  },
];

function SuggestionSection({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const [openId, setOpenId] = useState<keyof Profile | null>(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<keyof Profile | null>(null);

  const unanswered = SUGGESTION_FIELDS.filter((f) => !profile[f.id]);
  const answered = SUGGESTION_FIELDS.length - unanswered.length;

  if (unanswered.length === 0) return null;

  function open(field: SuggestionField) {
    if (openId === field.id) { setOpenId(null); setDraft(""); return; }
    setOpenId(field.id);
    setDraft(profile[field.id] ?? "");
  }

  function toggleMulti(opt: string, field: SuggestionField) {
    const vals = draft ? draft.split(SEPARATOR) : [];
    if (vals.includes(opt)) {
      setDraft(vals.filter((v) => v !== opt).join(SEPARATOR));
    } else {
      if (field.maxSelect && vals.length >= field.maxSelect) return;
      setDraft([...vals, opt].join(SEPARATOR));
    }
  }

  function saveDraft(field: SuggestionField) {
    if (!draft) return;
    const fmt = (v: string) => v.split(SEPARATOR).filter(Boolean).join("、");
    const value = field.type === "multiselect" ? fmt(draft) : draft;
    const updated = { ...profile, [field.id]: value };
    saveProfile(updated);
    onUpdate(updated);
    setSaved(field.id);
    setOpenId(null);
    setDraft("");
    setTimeout(() => setSaved(null), 1500);
  }

  return (
    <FadeUp delay={240} className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 text-sm font-bold">✦ 精度を上げる</span>
        </div>
        <span className="text-xs text-zinc-400">{answered} / {SUGGESTION_FIELDS.length} 回答済み</span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {unanswered.map((field, i) => {
          const isOpen = openId === field.id;
          const justSaved = saved === field.id;
          return (
            <div key={field.id} className={`${i > 0 ? "border-t border-zinc-100" : ""}`}>
              <button
                onClick={() => open(field)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 transition-colors cursor-pointer text-left"
              >
                <div>
                  <p className="text-zinc-900 text-sm font-medium">{field.question}</p>
                  {justSaved && <p className="text-emerald-500 text-xs mt-0.5">保存しました ✓</p>}
                </div>
                <span className="text-zinc-400 text-xs ml-3 shrink-0">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-zinc-400 text-xs mb-3">{field.subtitle}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {field.options.map((opt) => {
                      const active = field.type === "multiselect"
                        ? draft.split(SEPARATOR).includes(opt)
                        : draft === opt;
                      const selectedCount = draft.split(SEPARATOR).filter(Boolean).length;
                      const atLimit = !!field.maxSelect && selectedCount >= field.maxSelect && !active;
                      return (
                        <button
                          key={opt}
                          onClick={() => field.type === "multiselect"
                            ? toggleMulti(opt, field)
                            : setDraft(draft === opt ? "" : opt)
                          }
                          disabled={atLimit}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            active
                              ? "bg-red-500 border-red-500 text-white"
                              : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveDraft(field)}
                      disabled={!draft}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <IconCheck size={14} />
                      保存
                    </button>
                    <button
                      onClick={() => { setOpenId(null); setDraft(""); }}
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
    </FadeUp>
  );
}

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MainPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mood, setMood] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "liked" | "disliked" | null>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProfile();
    if (!p) { router.replace("/setup"); return; }
    setProfile(p);
  }, [router]);

  const refreshFeedbackMap = useCallback((titles: string[]) => {
    const map: Record<string, "liked" | "disliked" | null> = {};
    titles.forEach((t) => { map[t] = getFeedbackState(t); });
    setFeedbackMap(map);
  }, []);

  async function generate() {
    if (!mood.trim() || !profile) return;
    setLoading(true);
    setRetrying(false);
    setError("");
    setIdeas([]);
    setExpandedId(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: mood.trim(), profile, feedback: getFeedback() }),
      });

      if (!res.ok) {
        if (res.status === 500) setRetrying(true);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "生成に失敗しました");
      }

      const data = await res.json();
      setIdeas(data.ideas);
      refreshFeedbackMap(data.ideas.map((i: Idea) => i.title));
      addHistory(mood.trim(), data.ideas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  function handleFeedback(idea: Idea, type: "liked" | "disliked") {
    const current = feedbackMap[idea.title];
    removeFeedback(idea.title);
    if (current === type) {
      setFeedbackMap((m) => ({ ...m, [idea.title]: null }));
    } else {
      if (type === "liked") addLiked({ title: idea.title, mood });
      else addDisliked({ title: idea.title, mood });
      setFeedbackMap((m) => ({ ...m, [idea.title]: type }));
    }
  }

  function copyIdea(idea: Idea) {
    const text = `【タイトル】\n${idea.title}\n\n【企画内容】\n${idea.description}\n\n【${platform.hookLabel}】\n${idea.hook}\n\n【${platform.visualLabel}】\n${idea.thumbnail}\n\n【${platform.productionLabel}】\n${idea.filming}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.title);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!profile) return null;

  const platform = getPlatform(profile.platform);

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto">
        <FadeUp delay={0} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
            <IconCamera size={22} />
            <span>企画メーカー</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/history")}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              履歴
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <IconUser size={14} />
              プロフィール
            </button>
            <ThemeToggle size={15} />
          </div>
        </FadeUp>

        <FadeUp delay={60} className="flex flex-wrap gap-2 mb-8">
          {[profile.contentNiche, profile.creatorIdentity].filter(Boolean).map((tag) => (
            <span key={tag} className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs text-zinc-500">
              {tag}
            </span>
          ))}
        </FadeUp>

        <FadeUp delay={120} className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h1 className="text-zinc-900 font-bold text-xl mb-1">今日の気分は？</h1>
          <p className="text-zinc-500 text-sm mb-4">一言入力するだけで企画を5つ生成します</p>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder="例：なんか元気、やる気ない、ワクワクしてる..."
            className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors text-base"
            disabled={loading}
          />
        </FadeUp>

        <FadeUp delay={180} className="mb-8">
          <button
            onClick={generate}
            disabled={!mood.trim() || loading}
            className="w-full py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <><IconLoader size={18} className="animate-spin" />{retrying ? "リトライ中..." : "企画を考え中..."}</>
            ) : (
              <><IconSparkle size={18} />企画を5つ生成</>
            )}
          </button>
        </FadeUp>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">{error}</div>
        )}

        {ideas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-zinc-500 text-sm font-medium">生成された企画（{mood}）</h2>
              <span className="text-zinc-400 text-xs">評価で精度が上がります</span>
            </div>

            {ideas.map((idea, i) => {
              const fb = feedbackMap[idea.title];
              const copied = copiedId === idea.title;
              const expanded = expandedId === idea.title;

              return (
                <FadeUp key={i} delay={i * 80} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 transition-colors">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-red-500 font-bold text-lg leading-none mt-0.5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-zinc-900 font-bold text-base mb-2 leading-tight">{idea.title}</h3>
                        <p className="text-zinc-500 text-sm mb-3 leading-relaxed">{idea.description}</p>

                        <div className="bg-zinc-100 rounded-lg px-3 py-2 mb-3">
                          <span className="text-xs text-zinc-500 font-medium">{platform.hookLabel}：</span>
                          <span className="text-xs text-zinc-700 ml-1">{idea.hook}</span>
                        </div>

                        <button
                          onClick={() => setExpandedId(expanded ? null : idea.title)}
                          className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer mb-3 flex items-center gap-1"
                        >
                          {expanded ? "▲ 閉じる" : `▼ ${platform.visualLabel}・${platform.productionLabel}を見る`}
                        </button>

                        {expanded && (
                          <div className="space-y-2 mb-3">
                            <div className="bg-zinc-100 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
                                <IconImage size={12} />
                                {platform.visualLabel}
                              </div>
                              <p className="text-xs text-zinc-700 leading-relaxed">{idea.thumbnail}</p>
                            </div>
                            <div className="bg-zinc-100 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
                                <IconFilm size={12} />
                                {platform.productionLabel}
                              </div>
                              <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">{idea.filming}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeedback(idea, "liked")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                              fb === "liked"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                            }`}
                          >
                            <IconThumbUp size={13} />いい感じ
                          </button>
                          <button
                            onClick={() => handleFeedback(idea, "disliked")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                              fb === "disliked"
                                ? "bg-red-50 border-red-500 text-red-600"
                                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                            }`}
                          >
                            <IconThumbDown size={13} />違う
                          </button>
                          <button
                            onClick={() => copyIdea(idea)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ml-auto ${
                              copied
                                ? "border-zinc-400 text-zinc-700"
                                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                            }`}
                          >
                            <IconCopy size={13} />
                            {copied ? "コピー済み" : "コピー"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              );
            })}

            <button
              onClick={() => { setMood(""); setIdeas([]); setExpandedId(null); }}
              className="w-full py-3 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 border border-zinc-200 hover:border-zinc-400 transition-all cursor-pointer mt-2"
            >
              もう一度生成する
            </button>
          </div>
        )}

        <SuggestionSection
          profile={profile}
          onUpdate={(updated) => setProfile(updated)}
        />
      </div>
    </div>
  );
}
