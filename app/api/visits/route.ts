import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { createVisitSchema } from "@/validations/visit";
import { generateVisitCode } from "@/utils/visit-code";
import { sendPushToUsers } from "@/lib/push/notify";
import { visitAssignedPayload } from "@/lib/push/templates";

// 방문 건 목록 조회 (캘린더 모드 + 목록 모드)
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  // 캘린더 모드 파라미터 (기존)
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const date = searchParams.get("date");
  const today = searchParams.get("today");
  const status = searchParams.get("status");

  // 목록 모드 파라미터 (신규)
  const search = searchParams.get("search");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const userIdParam = searchParams.get("user_id");
  const facilityCategory = searchParams.get("facility_category");
  const facilityType = searchParams.get("facility_type");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const supabase = getSupabase();

  // 미완료 건 자동 업데이트 (예정일 경과한 scheduled → missed)
  const todayStr = new Date().toISOString().split("T")[0];
  await supabase
    .from("visits")
    .update({ status: "missed" })
    .eq("tenant_id", session.tenantId)
    .eq("status", "scheduled")
    .lt("scheduled_date", todayStr);

  // 모드 판단: 캘린더 특정 파라미터가 있으면 캘린더 모드, 아니면 목록 모드
  const isCalendarMode = !!(year || month || date || today);

  if (isCalendarMode) {
    // === 캘린더 모드 (기존 동작 유지) ===
    let query = supabase
      .from("visits")
      .select(`
        id, visit_code, scheduled_date, completed_at, status, method, disinfectants_used, notes, user_id,
        client_id, client_name, client_address, client_facility_category, client_facility_type,
        certificates(id, certificate_number, hwpx_file_url, pdf_file_url)
      `)
      .eq("tenant_id", session.tenantId)
      .order("scheduled_date", { ascending: true });

    if (today === "true") {
      query = query.eq("scheduled_date", todayStr);
    } else if (date) {
      query = query.eq("scheduled_date", date);
    } else if (year && month) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endMonth = parseInt(month);
      const endYear = parseInt(year);
      const nextMonth = endMonth === 12 ? 1 : endMonth + 1;
      const nextYear = endMonth === 12 ? endYear + 1 : endYear;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      query = query.gte("scheduled_date", startDate).lt("scheduled_date", endDate);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // 역할별 강제 필터: member는 본인 담당 건만
    if (session.role === "member") {
      query = query.eq("user_id", session.userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ visits: data || [] });
  }

  // === 목록 모드 (신규) ===
  const page = Math.max(1, parseInt(pageParam || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(limitParam || "12")));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("visits")
    .select(
      `
      id, visit_code, scheduled_date, completed_at, status, method, disinfectants_used, notes, user_id,
      client_id, client_name, client_address, client_facility_category, client_facility_type,
      users(id, name),
      certificates(id, certificate_number, pdf_file_url)
    `,
      { count: "exact" }
    )
    .eq("tenant_id", session.tenantId)
    .order("scheduled_date", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("scheduled_date", dateFrom);
  if (dateTo) query = query.lte("scheduled_date", dateTo);
  if (search) query = query.ilike("client_name", `%${search}%`);
  if (facilityCategory) query = query.eq("client_facility_category", facilityCategory);
  if (facilityType) query = query.eq("client_facility_type", facilityType);

  // 역할별 강제 필터:
  // - member: 반드시 본인 담당 건만 (클라이언트 파라미터 무시)
  // - admin: user_id 파라미터 있으면 해당 담당자로 필터
  if (session.role === "member") {
    query = query.eq("user_id", session.userId);
  } else if (userIdParam) {
    query = query.eq("user_id", userIdParam);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    visits: data || [],
    total,
    page,
    totalPages,
  });
}

// 방문 일정 등록 (admin만)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 등록할 수 있습니다" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createVisitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { clientId, scheduledDate, userId, notes } = parsed.data;
  const supabase = getSupabase();

  // clientId가 같은 tenant 소속인지 확인 + 박제할 고객 정보 조회
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      "id, is_active, name, address, facility_category, facility_type, area, area_pyeong, volume, contact_name, contact_position"
    )
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "존재하지 않는 고객입니다" }, { status: 400 });
  }
  if (!client.is_active) {
    return NextResponse.json({ error: "비활성화된 고객은 일정을 등록할 수 없습니다" }, { status: 400 });
  }

  // userId가 제공되면 같은 tenant 소속 member인지 확인
  if (userId) {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "존재하지 않는 담당자입니다" }, { status: 400 });
    }
  }

  const visitCode = await generateVisitCode(session.tenantId, scheduledDate);
  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("visits")
    .insert({
      client_id: clientId,
      tenant_id: session.tenantId,
      user_id: userId || null,
      scheduled_date: scheduledDate,
      status: "scheduled",
      notes: notes || null,
      visit_code: visitCode,
      client_name: client.name,
      client_address: client.address,
      client_facility_category: client.facility_category,
      client_facility_type: client.facility_type,
      client_area: client.area,
      client_area_pyeong: client.area_pyeong,
      client_volume: client.volume,
      client_contact_name: client.contact_name,
      client_contact_position: client.contact_position,
      created_at: now,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "방문 일정 등록에 실패했습니다" }, { status: 500 });
  }

  if (userId && userId !== session.userId) {
    await sendPushToUsers(
      [userId],
      visitAssignedPayload({
        visitId: inserted.id,
        clientName: client.name,
        scheduledDate,
      })
    ).catch((e: unknown) => console.error("배정 알림 발송 실패", e));
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
