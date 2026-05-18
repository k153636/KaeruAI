import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("user_data")
    .select("profile, feedback, history")
    .eq("user_id", userId)
    .single();

  return Response.json(data ?? { profile: null, feedback: null, history: null });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await supabaseAdmin.from("user_data").upsert({
    user_id:    userId,
    profile:    body.profile  ?? null,
    feedback:   body.feedback ?? null,
    history:    body.history  ?? null,
    updated_at: new Date().toISOString(),
  });

  return Response.json({ ok: true });
}
