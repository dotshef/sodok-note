import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabase } from "@/lib/supabase/server";
import { verifyCodeSchema } from "@/lib/validations/auth";

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;
    const supabase = getSupabase();
    const now = new Date();

    const { data: row } = await supabase
      .from("email_verification")
      .select("id, expires_at, verified_at")
      .eq("email", email)
      .eq("purpose", "password_reset")
      .eq("code", code)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!row) {
      return NextResponse.json(
        { error: "인증번호가 올바르지 않습니다" },
        { status: 400 }
      );
    }

    if (new Date(row.expires_at) < now) {
      return NextResponse.json(
        { error: "인증번호가 만료되었습니다. 다시 요청해주세요" },
        { status: 400 }
      );
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS);

    const { error: updateError } = await supabase
      .from("email_verification")
      .update({
        verified_at: now.toISOString(),
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      return NextResponse.json(
        { error: "인증 처리에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ resetToken });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
