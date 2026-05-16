import type { Profile } from "./types";

const REQUIRED_KEYS: (keyof Profile)[] = [
  "motivation",
  "bestComment",
  "creativeTriger",
  "audienceRelation",
  "coreTheme",
  "avoid",
  "reference",
  "processingStyle",
  "creatorIdentity",
  "successDefinition",
];

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("yt_profile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const isValid = REQUIRED_KEYS.every((k) => typeof parsed[k] === "string");
    return isValid ? (parsed as unknown as Profile) : null;
  } catch {
    return null;
  }
}
