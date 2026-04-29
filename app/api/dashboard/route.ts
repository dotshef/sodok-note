import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { todayKst, weekRangeKst, monthRangeKst } from "@/lib/date/kst";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const todayStr = todayKst();

  // 미완료 건 자동 업데이트
  await supabase
    .from("visits")
    .update({ status: "missed" })
    .eq("tenant_id", session.tenantId)
    .eq("status", "scheduled")
    .lt("scheduled_date", todayStr);

  // 역할별 필터: member는 본인 담당 건만
  const isMember = session.role === "member";

  // 오늘 방문 예정
  let todayQuery = supabase
    .from("visits")
    .select("id, visit_code, scheduled_date, status, client_id, client_name, client_address, users(id, name)")
    .eq("tenant_id", session.tenantId)
    .eq("scheduled_date", todayStr)
    .order("created_at", { ascending: true });
  if (isMember) todayQuery = todayQuery.eq("user_id", session.userId);
  const { data: todayVisits } = await todayQuery;

  // 이번 주 예정 (KST 기준 월~일)
  const { start: weekStart, end: weekEnd, days: weekDayStrs } = weekRangeKst();
  let weekCountQuery = supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenantId)
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd);
  if (isMember) weekCountQuery = weekCountQuery.eq("user_id", session.userId);
  const { count: weekCount } = await weekCountQuery;

  // 미완료 건
  let missedQuery = supabase
    .from("visits")
    .select("id, scheduled_date, client_name")
    .eq("tenant_id", session.tenantId)
    .eq("status", "missed")
    .order("scheduled_date", { ascending: false })
    .limit(10);
  if (isMember) missedQuery = missedQuery.eq("user_id", session.userId);
  const { data: missedVisits } = await missedQuery;

  // 이번 달 완료 (KST 기준)
  const { start: monthStart, end: monthEnd } = monthRangeKst();
  let monthQuery = supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenantId)
    .eq("status", "completed")
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd);
  if (isMember) monthQuery = monthQuery.eq("user_id", session.userId);
  const { count: monthCompleted } = await monthQuery;

  // 이번 주 요일별 데이터 (차트용)
  let weekVisitsQuery = supabase
    .from("visits")
    .select("scheduled_date, status")
    .eq("tenant_id", session.tenantId)
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd);
  if (isMember) weekVisitsQuery = weekVisitsQuery.eq("user_id", session.userId);
  const { data: weekVisits } = await weekVisitsQuery;

  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const weeklyChart = weekDayStrs.map((dateStr, i) => {
    const dayVisits = (weekVisits || []).filter((v) => v.scheduled_date === dateStr);
    return {
      label: dayLabels[i],
      completed: dayVisits.filter((v) => v.status === "completed").length,
      scheduled: dayVisits.filter((v) => v.status === "scheduled").length,
      missed: dayVisits.filter((v) => v.status === "missed").length,
    };
  });

  return NextResponse.json({
    todayCount: todayVisits?.length || 0,
    weekCount: weekCount || 0,
    missedCount: missedVisits?.length || 0,
    monthCompleted: monthCompleted || 0,
    todayVisits: todayVisits || [],
    missedVisits: missedVisits || [],
    weeklyChart,
  });
}
