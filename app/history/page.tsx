"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { HistoryEntry, Idea } from "@/lib/types";
import { getHistory, deleteHistory } from "@/lib/history";
import { loadProfile } from "@/lib/profile";
import { getPlatform } from "@/lib/platforms";
import { IconCamera, IconArrowLeft } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCopy({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return `今日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  } else if (diffDays === 1) {
    return `昨日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedIdeaKey, setExpandedIdeaKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState("youtube");

  useEffect(() => {
    setEntries(getHistory());
    const p = loadProfile();
    if (p) setPlatformId(p.platform);
  }, []);

  const platform = getPlatform(platformId);

  function handleDelete(id: string) {
    deleteHistory(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function copyIdea(idea: Idea, entryId: string) {
    const key = `${entryId}-${idea.title}`;
    const text = `【タイトル】\n${idea.title}\n\n【企画内容】\n${idea.description}\n\n【${platform.hookLabel}】\n${idea.hook}\n\n【${platform.visualLabel}】\n${idea.thumbnail}\n\n【${platform.productionLabel}】\n${idea.filming}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-lg">
            <IconCamera size={22} />
            <span>履歴</span>
          </div>
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

        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-sm">まだ生成した企画がありません</p>
            <button
              onClick={() => router.push("/main")}
              className="mt-4 text-zinc-500 text-sm hover:text-zinc-700 transition-colors cursor-pointer"
            >
              企画を生成する →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isOpen = expandedId === entry.id;
              return (
                <div key={entry.id} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-900 text-sm font-medium truncate">「{entry.mood}」</p>
                      <p className="text-zinc-400 text-xs mt-0.5">{formatDate(entry.createdAt)} · {entry.ideas.length}件の企画</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer p-1"
                      >
                        <IconTrash size={14} />
                      </button>
                      <span className="text-zinc-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-zinc-200">
                      {entry.ideas.map((idea, i) => {
                        const ideaKey = `${entry.id}-${idea.title}`;
                        const isIdeaOpen = expandedIdeaKey === ideaKey;
                        const copied = copiedKey === ideaKey;
                        return (
                          <div key={i} className="border-b border-zinc-100 last:border-b-0 px-4 py-3">
                            <div className="flex items-start gap-2">
                              <span className="text-zinc-400 font-bold text-sm shrink-0 mt-0.5">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-zinc-900 text-sm font-medium leading-snug mb-1">{idea.title}</p>
                                <p className="text-zinc-500 text-xs leading-relaxed mb-2">{idea.description}</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setExpandedIdeaKey(isIdeaOpen ? null : ideaKey)}
                                    className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                                  >
                                    {isIdeaOpen ? "▲ 閉じる" : "▼ 詳細"}
                                  </button>
                                  <button
                                    onClick={() => copyIdea(idea, entry.id)}
                                    className={`flex items-center gap-1 text-xs ml-auto transition-colors cursor-pointer ${copied ? "text-zinc-700" : "text-zinc-400 hover:text-zinc-600"}`}
                                  >
                                    <IconCopy size={12} />
                                    {copied ? "コピー済み" : "コピー"}
                                  </button>
                                </div>
                                {isIdeaOpen && (
                                  <div className="space-y-2 mt-2">
                                    <div className="bg-zinc-100 rounded-xl px-3 py-2">
                                      <p className="text-xs text-zinc-500 font-medium mb-1">{platform.hookLabel}</p>
                                      <p className="text-xs text-zinc-700">{idea.hook}</p>
                                    </div>
                                    <div className="bg-zinc-100 rounded-xl px-3 py-2">
                                      <p className="text-xs text-zinc-500 font-medium mb-1">{platform.visualLabel}</p>
                                      <p className="text-xs text-zinc-700">{idea.thumbnail}</p>
                                    </div>
                                    <div className="bg-zinc-100 rounded-xl px-3 py-2">
                                      <p className="text-xs text-zinc-500 font-medium mb-1">{platform.productionLabel}</p>
                                      <p className="text-xs text-zinc-700 whitespace-pre-line">{idea.filming}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
