import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { getSupabase } from "@/lib/supabase/server";
import { subscribeSchema, unsubscribeSchema } from "@/lib/validations/push";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const { endpoint, keys, userAgent } = parsed.data;
  const now = new Date().toISOString();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        tenant_id: session.tenantId,
        user_id: session.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent ?? null,
        created_at: now,
        updated_at: now,
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    console.error("구독 저장 실패", error);
    return NextResponse.json({ error: "구독에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data.endpoint)
    .eq("tenant_id", session.tenantId)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: "구독 해제에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
