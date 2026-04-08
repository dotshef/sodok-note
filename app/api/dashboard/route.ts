import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  // 미완료 건 자동 업데이트
  await supabase
    .from("visits")
    .update({ status: "missed" })
    .eq("tenant_id", session.tenantId)
    .eq("status", "scheduled")
    .lt("scheduled_date", todayStr);

  // 오늘 방문 예정
  const { data: todayVisits } = await supabase
    .from("visits")
    .select("id, scheduled_date, status, clients(id, name, facility_type), users(id, name)")
    .eq("tenant_id", session.tenantId)
    .eq("scheduled_date", todayStr)
    .order("created_at", { ascending: true });

  // 이번 주 예정
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { count: weekCount } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenantId)
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd);

  // 미완료 건
  const { data: missedVisits } = await supabase
    .from("visits")
    .select("id, scheduled_date, clients(id, name)")
    .eq("tenant_id", session.tenantId)
    .eq("status", "missed")
    .order("scheduled_date", { ascending: false })
    .limit(10);

  // 이번 달 완료
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const { count: monthCompleted } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", session.tenantId)
    .eq("status", "completed")
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd);

  // 이번 주 요일별 데이터 (차트용)
  const weekDays = eachDayOfInterval({
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });

  const { data: weekVisits } = await supabase
    .from("visits")
    .select("scheduled_date, status")
    .eq("tenant_id", session.tenantId)
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd);

  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const weeklyChart = weekDays.map((day, i) => {
    const dateStr = format(day, "yyyy-MM-dd");
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
