import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { updateClientSchema } from "@/lib/validations/client";

// 고객 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 조회할 수 있습니다" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  // 고객 정보 + 방문 이력 + 증명서
  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      *,
      visits(
        id, scheduled_date, completed_at, status, method, chemicals_used, user_id,
        certificates(id, certificate_number, file_url)
      )
    `)
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "고객을 찾을 수 없습니다" }, { status: 404 });
  }

  // 통계 계산
  const visits = client.visits || [];
  const totalVisits = visits.length;
  const completedVisits = visits.filter((v: { status: string }) => v.status === "completed").length;
  const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;
  const certificateCount = visits.filter(
    (v: { certificates: unknown }) => v.certificates && (Array.isArray(v.certificates) ? v.certificates.length > 0 : true)
  ).length;

  return NextResponse.json({
    ...client,
    stats: { totalVisits, completionRate, certificateCount },
  });
}

// 고객 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 수정할 수 있습니다" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabase = getSupabase();

  const updateData: Record<string, unknown> = { updated_at: now };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.facilityType !== undefined) updateData.facility_type = parsed.data.facilityType;
  if (parsed.data.area !== undefined) updateData.area = parsed.data.area;
  if (parsed.data.areaPyeong !== undefined) updateData.area_pyeong = parsed.data.areaPyeong;
  if (parsed.data.volume !== undefined) updateData.volume = parsed.data.volume;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.contactName !== undefined) updateData.contact_name = parsed.data.contactName;
  if (parsed.data.contactPhone !== undefined) updateData.contact_phone = parsed.data.contactPhone;
  if (parsed.data.contactPosition !== undefined) updateData.contact_position = parsed.data.contactPosition;
  if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

  const { error } = await supabase
    .from("clients")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return NextResponse.json({ error: "수정에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// 고객 비활성화 (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 삭제할 수 있습니다" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("clients")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
