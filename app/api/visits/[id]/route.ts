import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { sendPushToUsers } from "@/lib/push/notify";
import { visitAssignedPayload, visitCompletedPayload } from "@/lib/push/templates";

// 방문 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  // 박제값(client_*)은 visit row에서 직접 가져옴.
  // clients 조인은 "고객 상세로 이동" link용 id + 박제 안 한 운영용 필드(phone/email)에만 사용.
  const { data, error } = await supabase
    .from("visits")
    .select(`
      *,
      clients(id, contact_phone, contact_email),
      certificates(id, certificate_number, hwpx_file_url, hwpx_file_name, pdf_file_url, pdf_file_name, sent_at, sent_to)
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
    const { method, disinfectantsUsed, notes } = body;

    const { data: updatedVisit, error: updateError } = await supabase
      .from("visits")
      .update({
        status: "completed",
        completed_at: now,
        method: method || null,
        disinfectants_used: disinfectantsUsed || null,
        notes: notes || null,
      })
      .eq("id", id)
      .eq("tenant_id", session.tenantId)
      .select("client_name")
      .single();

    if (updateError || !updatedVisit) {
      return NextResponse.json({ error: "업데이트에 실패했습니다" }, { status: 500 });
    }

    // 최근 사용 문구 자동 등록
    if (method) {
      await supabase
        .from("disinfection_methods")
        .upsert(
          { tenant_id: session.tenantId, name: method, is_active: true, created_at: now },
          { onConflict: "tenant_id,name" }
        );
    }
    if (disinfectantsUsed?.length) {
      for (const d of disinfectantsUsed) {
        if (d.name) {
          await supabase
            .from("disinfectants")
            .upsert(
              { tenant_id: session.tenantId, name: d.name, is_active: true, created_at: now },
              { onConflict: "tenant_id,name" }
            );
        }
      }
    }

    // admin들에게 완료 알림 (본인이 admin이면 자기 자신 제외)
    const [{ data: completer }, { data: admins }] = await Promise.all([
      supabase.from("users").select("name").eq("id", session.userId).single(),
      supabase
        .from("users")
        .select("id")
        .eq("tenant_id", session.tenantId)
        .eq("role", "admin")
        .eq("is_active", true)
        .neq("id", session.userId),
    ]);

    if (completer && admins && admins.length > 0) {
      await sendPushToUsers(
        admins.map((a) => a.id),
        visitCompletedPayload({
          visitId: id,
          completerName: completer.name,
          clientName: updatedVisit.client_name,
        })
      ).catch((e) => console.error("완료 알림 발송 실패", e));
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

    const newUserId: string | null = body.userId || null;

    const { data: existing } = await supabase
      .from("visits")
      .select("user_id")
      .eq("id", id)
      .eq("tenant_id", session.tenantId)
      .single();

    const { error: updateError } = await supabase
      .from("visits")
      .update({ user_id: newUserId })
      .eq("id", id)
      .eq("tenant_id", session.tenantId);

    if (updateError) {
      return NextResponse.json({ error: "배정에 실패했습니다" }, { status: 500 });
    }

    if (newUserId && newUserId !== existing?.user_id && newUserId !== session.userId) {
      const { data: visitInfo } = await supabase
        .from("visits")
        .select("scheduled_date, client_name")
        .eq("id", id)
        .eq("tenant_id", session.tenantId)
        .single();

      if (visitInfo) {
        await sendPushToUsers(
          [newUserId],
          visitAssignedPayload({
            visitId: id,
            clientName: visitInfo.client_name,
            scheduledDate: visitInfo.scheduled_date,
          })
        ).catch((e: unknown) => console.error("배정 알림 발송 실패", e));
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
}

// 방문 삭제 (admin만)
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
    .from("visits")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
