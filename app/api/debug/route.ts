export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "none";
  const ip = forwarded.split(",")[0]?.trim() ?? "anonymous";
  const whitelist = process.env.WHITELISTED_IPS ?? "(unset)";
  return Response.json({ ip, forwarded, whitelist });
}
