import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { sendPushToUsers } from "@/lib/push/notify";
import { visitTomorrowPayload } from "@/lib/push/templates";
import { tomorrowKst } from "@/lib/date/kst";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabase();

  const tomorrowStr = tomorrowKst();

  const { data: visits, error } = await supabase
    .from("visits")
    .select("id, user_id, client_name, users!inner(is_active)")
    .eq("status", "scheduled")
    .eq("scheduled_date", tomorrowStr)
    .eq("users.is_active", true)
    .not("user_id", "is", null);

  if (error) {
    console.error("cron visit-reminders 조회 실패", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  const grouped = new Map<string, { count: number; firstClientName: string }>();
  for (const v of visits || []) {
    if (!v.user_id) continue;
    const entry = grouped.get(v.user_id);
    if (entry) {
      entry.count += 1;
    } else {
      grouped.set(v.user_id, { count: 1, firstClientName: v.client_name || "" });
    }
  }

  let totalSent = 0;
  for (const [userId, info] of grouped) {
    const result = await sendPushToUsers(
      [userId],
      visitTomorrowPayload({
        count: info.count,
        firstClientName: info.firstClientName,
      })
    );
    totalSent += result.sent;
  }

  return NextResponse.json({
    users: grouped.size,
    visits: visits?.length || 0,
    sent: totalSent,
  });
}
