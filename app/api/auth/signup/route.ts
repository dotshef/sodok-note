import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/jwt";
import { signupSchema } from "@/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { companyName, businessNumber, ownerName, phone, address, email, password, name } = parsed.data;

    // 이메일 중복 확인
    const { data: existing } = await getSupabase()
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다" },
        { status: 409 }
      );
    }

    // 이메일 인증 확인
    const { data: verification } = await getSupabase()
      .from("email_verification")
      .select("id")
      .eq("email", email)
      .eq("purpose", "signup")
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return NextResponse.json(
        { error: "이메일 인증을 완료해주세요" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    // 트랜잭션: tenant 생성 → user(admin) 생성
    const { data: tenant, error: tenantError } = await getSupabase()
      .from("tenants")
      .insert({
        name: companyName,
        business_number: businessNumber || null,
        owner_name: ownerName || null,
        phone: phone || null,
        address: address || null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "업체 등록에 실패했습니다" },
        { status: 500 }
      );
    }

    const { data: user, error: userError } = await getSupabase()
      .from("users")
      .insert({
        tenant_id: tenant.id,
        email,
        password_hash: passwordHash,
        name,
        role: "admin",
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (userError || !user) {
      // 롤백: tenant 삭제
      await getSupabase().from("tenants").delete().eq("id", tenant.id);
      return NextResponse.json(
        { error: "계정 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    // 세션 생성
    await setSessionCookie({
      userId: user.id,
      tenantId: tenant.id,
      role: "admin",
      email,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
