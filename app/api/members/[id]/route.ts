import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { updateMemberSchema } from "@/validations/member";
import { hashPassword } from "@/lib/auth/password";

// 멤버 단건 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, phone, role, is_active")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// 멤버 수정
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
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabase = getSupabase();

  const updateData: Record<string, unknown> = { updated_at: now };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.password) updateData.password_hash = await hashPassword(parsed.data.password);
  if (parsed.data.role !== undefined) {
    if (id === session.userId) {
      return NextResponse.json({ error: "자신의 역할은 변경할 수 없습니다" }, { status: 400 });
    }
    updateData.role = parsed.data.role;
  }
  if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active;

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return NextResponse.json({ error: "수정에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// 멤버 비활성화
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

  // 자기 자신은 비활성화 불가
  if (id === session.userId) {
    return NextResponse.json({ error: "자기 자신은 비활성화할 수 없습니다" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("users")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return NextResponse.json({ error: "비활성화에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
