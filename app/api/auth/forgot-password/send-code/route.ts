import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { sendCodeSchema } from "@/lib/validations/auth";
import { sendVerificationCodeEmail } from "@/lib/email/resend";

const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "등록되지 않은 이메일입니다" },
        { status: 404 }
      );
    }

    const now = new Date();
    const code = generateCode();

    const { error: insertError } = await supabase
      .from("email_verification")
      .insert({
        email,
        code,
        purpose: "password_reset",
        expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: "인증번호 발급에 실패했습니다" },
        { status: 500 }
      );
    }

    await sendVerificationCodeEmail({
      to: email,
      code,
      purpose: "password_reset",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
