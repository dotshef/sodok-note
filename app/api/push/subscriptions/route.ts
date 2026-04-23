import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { getSupabase } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, user_agent, created_at, updated_at")
    .eq("tenant_id", session.tenantId)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "조회에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json(data);
}
