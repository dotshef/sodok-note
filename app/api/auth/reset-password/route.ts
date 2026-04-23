import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { resetToken, password } = parsed.data;
    const supabase = getSupabase();
    const now = new Date();

    const { data: verification } = await supabase
      .from("email_verification")
      .select("id, email, reset_token_expires_at, used_at")
      .eq("reset_token", resetToken)
      .eq("purpose", "password_reset")
      .single();

    if (!verification || verification.used_at) {
      return NextResponse.json(
        { error: "유효하지 않은 요청입니다. 처음부터 다시 시도해주세요" },
        { status: 400 }
      );
    }

    if (
      !verification.reset_token_expires_at ||
      new Date(verification.reset_token_expires_at) < now
    ) {
      return NextResponse.json(
        { error: "재설정 세션이 만료되었습니다. 다시 시도해주세요" },
        { status: 400 }
      );
    }

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", verification.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(password);

    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at: now.toISOString(),
      })
      .eq("id", user.id);

    if (userUpdateError) {
      return NextResponse.json(
        { error: "비밀번호 변경에 실패했습니다" },
        { status: 500 }
      );
    }

    await supabase
      .from("email_verification")
      .update({
        used_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", verification.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
