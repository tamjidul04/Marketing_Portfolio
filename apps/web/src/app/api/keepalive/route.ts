import { createPublicClient } from "@/lib/supabase";

/**
 * Keeps the database awake. Supabase's free plan pauses a project after about a week with no
 * activity, which would leave the website with nothing to show. Vercel calls this once a day
 * (see vercel.json); it reads a single row and returns. Nothing is written or revealed.
 *
 * Optional: set CRON_SECRET in the Vercel project and Vercel sends it automatically; calls
 * without it are then refused, so only the daily job can use this address.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const { error } = await createPublicClient().from("profile").select("id").eq("id", 1).single();
  if (error) {
    console.error("keepalive failed:", error.message);
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
