import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/jwt";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력해주세요" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "새 비밀번호는 8자 이상이어야 합니다" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", session.userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다" }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await supabase
    .from("users")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", session.userId);

  return NextResponse.json({ success: true });
}
