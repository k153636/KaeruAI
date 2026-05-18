import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await getSupabaseAdmin()
    .from("user_data")
    .select("profile, feedback, history")
    .eq("user_id", user.id)
    .single();

  return Response.json(data ?? { profile: null, feedback: null, history: null });
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await getSupabaseAdmin().from("user_data").upsert({
    user_id:    user.id,
    profile:    body.profile  ?? null,
    feedback:   body.feedback ?? null,
    history:    body.history  ?? null,
    updated_at: new Date().toISOString(),
  });

  return Response.json({ ok: true });
}
