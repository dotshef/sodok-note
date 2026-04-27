import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { createMemberSchema } from "@/validations/member";

// 멤버 목록 조회
// page 파라미터가 있으면 페이지네이션 모드 (total/page/totalPages 반환),
// 없으면 전체 반환 (방문 모달·필터 같은 셀렉트용 호출 호환)
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const roleParam = searchParams.get("role");
  const search = searchParams.get("search");
  const isPaginated = pageParam !== null;

  const supabase = getSupabase();
  let query = supabase
    .from("users")
    .select("id, email, name, phone, role, is_active, created_at", isPaginated ? { count: "exact" } : {})
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: true });

  if (roleParam === "admin" || roleParam === "member") {
    query = query.eq("role", roleParam);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  let page = 1;
  let limit = 20;
  if (isPaginated) {
    page = Math.max(1, parseInt(pageParam!) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limitParam || "12") || 12));
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (isPaginated) {
    return NextResponse.json({
      members: data || [],
      total: count || 0,
      page,
      totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
    });
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

  const { email, password, name, phone, role } = parsed.data;
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
      role,
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
