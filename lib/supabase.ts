import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド（API routes）用 — service role key
export const supabaseAdmin = createClient(url, service);

// クライアントサイド（ブラウザ）用 — anon key
export function createSupabaseBrowser() {
  return createBrowserClient(url, anon);
}
