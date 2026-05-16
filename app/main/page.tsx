"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Idea } from "@/lib/types";
import { loadProfile } from "@/lib/profile";
import { getFeedback, getFeedbackState, addLiked, addDisliked, removeFeedback } from "@/lib/feedback";
import { addHistory } from "@/lib/history";
import { IconCamera, IconThumbUp, IconThumbDown, IconSparkle, IconUser, IconLoader } from "@/components/icons";
import { getPlatform } from "@/lib/platforms";

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

export default function MainPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile>>(null);
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
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
            <IconCamera size={22} />
            <span>企画メーカー</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/history")}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              履歴
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <IconUser size={14} />
              プロフィール
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[profile.contentNiche, profile.creatorIdentity].filter(Boolean).map((tag) => (
            <span key={tag} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400">
              {tag}
            </span>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h1 className="text-white font-bold text-xl mb-1">今日の気分は？</h1>
          <p className="text-zinc-500 text-sm mb-4">一言入力するだけで企画を5つ生成します</p>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder="例：なんか元気、やる気ない、ワクワクしてる..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
            disabled={loading}
          />
        </div>

        <button
          onClick={generate}
          disabled={!mood.trim() || loading}
          className="w-full py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white mb-8 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><IconLoader size={18} className="animate-spin" />{retrying ? "リトライ中..." : "企画を考え中..."}</>
          ) : (
            <><IconSparkle size={18} />企画を5つ生成</>
          )}
        </button>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-6 text-red-400 text-sm">{error}</div>
        )}

        {ideas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-zinc-400 text-sm font-medium">生成された企画（{mood}）</h2>
              <span className="text-zinc-600 text-xs">評価で精度が上がります</span>
            </div>

            {ideas.map((idea, i) => {
              const fb = feedbackMap[idea.title];
              const copied = copiedId === idea.title;
              const expanded = expandedId === idea.title;

              return (
                <div key={i} style={{ animationDelay: `${i * 80}ms` }} className="stagger-item bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-red-500 font-bold text-lg leading-none mt-0.5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base mb-2 leading-tight">{idea.title}</h3>
                        <p className="text-zinc-400 text-sm mb-3 leading-relaxed">{idea.description}</p>

                        <div className="bg-zinc-800 rounded-lg px-3 py-2 mb-3">
                          <span className="text-xs text-zinc-500 font-medium">{platform.hookLabel}：</span>
                          <span className="text-xs text-zinc-300 ml-1">{idea.hook}</span>
                        </div>

                        <button
                          onClick={() => setExpandedId(expanded ? null : idea.title)}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer mb-3 flex items-center gap-1"
                        >
                          {expanded ? "▲ 閉じる" : `▼ ${platform.visualLabel}・${platform.productionLabel}を見る`}
                        </button>

                        {expanded && (
                          <div className="space-y-2 mb-3">
                            <div className="bg-zinc-800 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
                                <IconImage size={12} />
                                {platform.visualLabel}
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{idea.thumbnail}</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
                                <IconFilm size={12} />
                                {platform.productionLabel}
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{idea.filming}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeedback(idea, "liked")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                              fb === "liked"
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <IconThumbUp size={13} />いい感じ
                          </button>
                          <button
                            onClick={() => handleFeedback(idea, "disliked")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                              fb === "disliked"
                                ? "bg-red-500/20 border-red-500 text-red-400"
                                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <IconThumbDown size={13} />違う
                          </button>
                          <button
                            onClick={() => copyIdea(idea)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ml-auto ${
                              copied
                                ? "border-zinc-500 text-zinc-300"
                                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <IconCopy size={13} />
                            {copied ? "コピー済み" : "コピー"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => { setMood(""); setIdeas([]); setExpandedId(null); }}
              className="w-full py-3 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer mt-2"
            >
              もう一度生成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
