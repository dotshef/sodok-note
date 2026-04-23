import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { sendPush } from "@/lib/push/send";
import { visitUpcomingPayload } from "@/lib/push/templates";

// 1시간 전 알림 - 15분 간격으로 실행.
// visits 테이블에 방문 시각(time)이 없으므로, 매일 고정 시각(09:00)에 방문하는 것으로 가정하고
// 08:00 ~ 08:14 사이의 호출에서만 발송하는 단순화된 로직.
// 실제 방문 시각 필드가 추가되면 로직 개선 필요.

const VISIT_START_HOUR = 9;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + kstOffsetMs);
  const hour = kst.getUTCHours();
  const minute = kst.getUTCMinutes();

  // 방문 1시간 전(= VISIT_START_HOUR - 1시) 첫 15분 구간에서만 실행
  if (hour !== VISIT_START_HOUR - 1 || minute >= 15) {
    return NextResponse.json({ skipped: true, hour, minute });
  }

  const todayStr = kst.toISOString().split("T")[0];
  const supabase = getSupabase();

  const { data: visits, error } = await supabase
    .from("visits")
    .select("id, user_id, clients(name, address)")
    .eq("status", "scheduled")
    .eq("scheduled_date", todayStr)
    .not("user_id", "is", null);

  if (error) {
    console.error("cron upcoming-visits 조회 실패", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  let totalSent = 0;
  for (const v of visits || []) {
    if (!v.user_id) continue;
    const client = v.clients as unknown as { name: string; address: string | null } | null;
    if (!client) continue;
    const result = await sendPush(
      v.user_id,
      visitUpcomingPayload({
        visitId: v.id,
        clientName: client.name,
        address: client.address,
      })
    );
    totalSent += result.sent;
  }

  return NextResponse.json({
    visits: visits?.length || 0,
    sent: totalSent,
  });
}
