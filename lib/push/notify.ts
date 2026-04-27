import { getSupabase } from "@/lib/supabase/server";
import { getWebPush } from "./push-wrapper";
import type { PushPayload, PushSubscriptionRecord } from "./types";

type SendResult = {
  sent: number;
  removed: number;
  failed: number;
};

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<SendResult> {
  if (userIds.length === 0) return { sent: 0, removed: 0, failed: 0 };

  const supabase = getSupabase();

  // 1. 구독 조회
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (error || !data) {
    console.error("유저 구독 조회 실패", error);
    return { sent: 0, removed: 0, failed: 0 };
  }

  const subs = data as PushSubscriptionRecord[];
  if (subs.length === 0) return { sent: 0, removed: 0, failed: 0 };

  // 2. webpush 발송
  const webpush = getWebPush();
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

  // 3. 죽은 endpoint 정리 + 결과 집계
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
