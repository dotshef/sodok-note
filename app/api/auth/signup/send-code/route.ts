import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { sendCodeSchema } from "@/validations/auth";
import { renderSignupVerificationEmail } from "@/lib/email/templates/signup-verification";
import { sendEmail } from "@/lib/email/resend";

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

    const { data: existing } = await supabase
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

    const now = new Date();
    const code = generateCode();

    const { error: insertError } = await supabase
      .from("email_verification")
      .insert({
        email,
        code,
        purpose: "signup",
        expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (insertError) {
      console.error("[signup/send-code] insert error:", insertError);
      return NextResponse.json(
        { error: "인증번호 발급에 실패했습니다" },
        { status: 500 }
      );
    }

    const { subject, html } = renderSignupVerificationEmail({ code });
    await sendEmail({ to: email, subject, html });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[signup/send-code] unexpected error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
