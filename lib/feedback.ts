import type { FeedbackStore, FeedbackEntry } from "./types";
import { storage } from "./storage";

const MAX_LIKED = 20;
const MAX_DISLIKED = 10;

export function getFeedback(): FeedbackStore {
  if (typeof window === "undefined") return { liked: [], disliked: [] };
  try {
    const raw = storage.getFeedback();
    return raw ? JSON.parse(raw) : { liked: [], disliked: [] };
  } catch {
    return { liked: [], disliked: [] };
  }
}

function save(store: FeedbackStore): void {
  storage.setFeedback(JSON.stringify(store));
}

export function addLiked(entry: FeedbackEntry): void {
  const store = getFeedback();
  store.liked = [entry, ...store.liked].slice(0, MAX_LIKED);
  save(store);
}

export function addDisliked(entry: FeedbackEntry): void {
  const store = getFeedback();
  store.disliked = [entry, ...store.disliked].slice(0, MAX_DISLIKED);
  save(store);
}

export function removeFeedback(title: string): void {
  const store = getFeedback();
  store.liked = store.liked.filter((e) => e.title !== title);
  store.disliked = store.disliked.filter((e) => e.title !== title);
  save(store);
}

export function getFeedbackState(title: string): "liked" | "disliked" | null {
  const store = getFeedback();
  if (store.liked.some((e) => e.title === title)) return "liked";
  if (store.disliked.some((e) => e.title === title)) return "disliked";
  return null;
}
