import { getSupabase } from "@/lib/supabase/server";
import { getWebPush } from "./client";
import type { PushPayload, PushSubscriptionRecord } from "./types";

type SendResult = {
  sent: number;
  removed: number;
  failed: number;
};

async function sendToSubscriptions(
  subs: PushSubscriptionRecord[],
  payload: PushPayload
): Promise<SendResult> {
  if (subs.length === 0) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  const webpush = getWebPush();
  const supabase = getSupabase();
  const payloadJson = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payloadJson
      )
    )
  );

  const gone: string[] = [];
  let sent = 0;
  let failed = 0;

  results.forEach((res, i) => {
    if (res.status === "fulfilled") {
      sent++;
      return;
    }
    const err = res.reason as { statusCode?: number };
    const status = err?.statusCode;
    if (status === 404 || status === 410) {
      gone.push(subs[i].endpoint);
    } else {
      failed++;
      console.error("푸시 발송 실패", subs[i].endpoint, err);
    }
  });

  if (gone.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", gone);
  }

  return { sent, removed: gone.length, failed };
}

export async function sendPush(userId: string, payload: PushPayload): Promise<SendResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("구독 조회 실패", error);
    return { sent: 0, removed: 0, failed: 0 };
  }

  return sendToSubscriptions(data as PushSubscriptionRecord[], payload);
}

export async function sendPushToTenant(
  tenantId: string,
  payload: PushPayload
): Promise<SendResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error || !data) {
    console.error("테넌트 구독 조회 실패", error);
    return { sent: 0, removed: 0, failed: 0 };
  }

  return sendToSubscriptions(data as PushSubscriptionRecord[], payload);
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<SendResult> {
  if (userIds.length === 0) return { sent: 0, removed: 0, failed: 0 };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (error || !data) {
    console.error("유저 구독 조회 실패", error);
    return { sent: 0, removed: 0, failed: 0 };
  }

  return sendToSubscriptions(data as PushSubscriptionRecord[], payload);
}
