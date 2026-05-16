import type { FeedbackStore, FeedbackEntry } from "./types";

const KEY = "yt_feedback";
const MAX_LIKED = 20;
const MAX_DISLIKED = 10;

export function getFeedback(): FeedbackStore {
  if (typeof window === "undefined") return { liked: [], disliked: [] };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { liked: [], disliked: [] };
  } catch {
    return { liked: [], disliked: [] };
  }
}

export function addLiked(entry: FeedbackEntry): void {
  const store = getFeedback();
  store.liked = [entry, ...store.liked].slice(0, MAX_LIKED);
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function addDisliked(entry: FeedbackEntry): void {
  const store = getFeedback();
  store.disliked = [entry, ...store.disliked].slice(0, MAX_DISLIKED);
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function removeFeedback(title: string): void {
  const store = getFeedback();
  store.liked = store.liked.filter((e) => e.title !== title);
  store.disliked = store.disliked.filter((e) => e.title !== title);
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getFeedbackState(title: string): "liked" | "disliked" | null {
  const store = getFeedback();
  if (store.liked.some((e) => e.title === title)) return "liked";
  if (store.disliked.some((e) => e.title === title)) return "disliked";
  return null;
}
