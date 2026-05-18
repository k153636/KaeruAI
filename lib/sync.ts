import { storage } from "./storage";

export async function syncPull(): Promise<boolean> {
  try {
    const res = await fetch("/api/sync");
    if (!res.ok) return false;
    const data = await res.json();
    if (data.profile)  storage.setProfile(JSON.stringify(data.profile));
    if (data.feedback) storage.setFeedback(JSON.stringify(data.feedback));
    if (data.history)  storage.setHistory(JSON.stringify(data.history));
    return true;
  } catch {
    return false;
  }
}

export function syncPush(): void {
  try {
    const profile  = storage.getProfile();
    const feedback = storage.getFeedback();
    const history  = storage.getHistory();
    fetch("/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile:  profile  ? JSON.parse(profile)  : null,
        feedback: feedback ? JSON.parse(feedback) : null,
        history:  history  ? JSON.parse(history)  : null,
      }),
    }).catch(() => {});
  } catch {
    // fire-and-forget
  }
}
