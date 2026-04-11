import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";

// 방문 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("visits")
    .select(`
      *,
      clients(id, name, facility_type, address, contact_name, contact_phone),
      certificates(id, certificate_number, pdf_url)
    `)
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "방문 건을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// 방문 완료 처리 / 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const now = new Date().toISOString();
  const supabase = getSupabase();

  // 방문 완료 처리
  if (body.action === "complete") {
    const { method, chemicalsUsed, notes } = body;

    const { error: updateError } = await supabase
      .from("visits")
      .update({
        status: "completed",
        completed_at: now,
        method: method || null,
        chemicals_used: chemicalsUsed || null,
        notes: notes || null,
      })
      .eq("id", id)
      .eq("tenant_id", session.tenantId);

    if (updateError) {
      return NextResponse.json({ error: "업데이트에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // 완료 취소 (admin만)
  if (body.action === "uncomplete") {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "관리자만 취소할 수 있습니다" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("visits")
      .update({ status: "scheduled", completed_at: null })
      .eq("id", id)
      .eq("tenant_id", session.tenantId);

    if (updateError) {
      return NextResponse.json({ error: "취소에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // 담당 기사 배정
  if (body.action === "assign") {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "관리자만 배정할 수 있습니다" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("visits")
      .update({ user_id: body.userId || null })
      .eq("id", id)
      .eq("tenant_id", session.tenantId);

    if (updateError) {
      return NextResponse.json({ error: "배정에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
}
