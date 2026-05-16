import type { Profile } from "./types";
import { storage } from "./storage";

const REQUIRED_KEYS: (keyof Profile)[] = [
  "platform", "contentNiche", "motivation", "bestComment", "creativeTriger", "audienceRelation",
  "targetAudience", "contentApproach", "avoid", "processingStyle",
  "creatorIdentity", "successDefinition",
];

export function loadProfile(): Profile | null {
  try {
    const raw = storage.getProfile();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const isValid = REQUIRED_KEYS.every((k) => typeof parsed[k] === "string");
    return isValid ? (parsed as unknown as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  storage.setProfile(JSON.stringify(profile));
}
