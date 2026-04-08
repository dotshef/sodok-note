import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { createMemberSchema } from "@/lib/validations/member";

// 멤버 목록 조회
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, phone, role, is_active, created_at")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data || [] });
}

// 멤버 등록 (admin만)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 등록할 수 있습니다" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password, name, phone } = parsed.data;
  const supabase = getSupabase();

  // 이메일 중복 확인
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "이미 등록된 이메일입니다" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  const { data: member, error: insertError } = await supabase
    .from("users")
    .insert({
      tenant_id: session.tenantId,
      email,
      password_hash: passwordHash,
      name,
      phone: phone || null,
      role: "member",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError || !member) {
    return NextResponse.json({ error: "등록에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ id: member.id }, { status: 201 });
}
