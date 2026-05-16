/**
 * ストレージ抽象レイヤー。
 * 現在はlocalStorageを使用。将来Supabase等に差し替え可能。
 */

export interface StorageAdapter {
  getProfile(): string | null;
  setProfile(value: string): void;
  getFeedback(): string | null;
  setFeedback(value: string): void;
  getHistory(): string | null;
  setHistory(value: string): void;
  clear(): void;
}

class LocalStorageAdapter implements StorageAdapter {
  private readonly PROFILE_KEY = "yt_profile";
  private readonly FEEDBACK_KEY = "yt_feedback";
  private readonly HISTORY_KEY = "yt_history";

  getProfile() {
    return typeof window !== "undefined" ? localStorage.getItem(this.PROFILE_KEY) : null;
  }
  setProfile(value: string) {
    localStorage.setItem(this.PROFILE_KEY, value);
  }
  getFeedback() {
    return typeof window !== "undefined" ? localStorage.getItem(this.FEEDBACK_KEY) : null;
  }
  setFeedback(value: string) {
    localStorage.setItem(this.FEEDBACK_KEY, value);
  }
  getHistory() {
    return typeof window !== "undefined" ? localStorage.getItem(this.HISTORY_KEY) : null;
  }
  setHistory(value: string) {
    localStorage.setItem(this.HISTORY_KEY, value);
  }
  clear() {
    localStorage.removeItem(this.PROFILE_KEY);
    localStorage.removeItem(this.FEEDBACK_KEY);
    localStorage.removeItem(this.HISTORY_KEY);
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();
