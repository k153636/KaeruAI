import type { HistoryEntry, Idea } from "./types";
import { storage } from "./storage";

const MAX_ENTRIES = 30;

function load(): HistoryEntry[] {
  try {
    const raw = storage.getHistory();
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  storage.setHistory(JSON.stringify(entries));
}

export function addHistory(mood: string, ideas: Idea[]): HistoryEntry {
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    mood,
    ideas,
    createdAt: Date.now(),
  };
  const entries = [entry, ...load()].slice(0, MAX_ENTRIES);
  save(entries);
  return entry;
}

export function getHistory(): HistoryEntry[] {
  return load();
}

export function deleteHistory(id: string) {
  save(load().filter((e) => e.id !== id));
}
