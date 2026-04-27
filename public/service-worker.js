// 소독노트 Service Worker - 푸시 알림 전용
// next-pwa가 Turbopack 빌드에서 동작하지 않으므로 정적 파일로 관리

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "소독노트", body: event.data.text() };
  }

  const title = payload.title || "소독노트";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/android-chrome-192x192.png",
    badge: payload.badge || "/icons/android-chrome-192x192.png",
    tag: payload.tag,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || "/dashboard";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === url) {
            await client.focus();
            return;
          }
        } catch (e) {
          // ignore
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })()
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldSub = event.oldSubscription;
        const newSub =
          event.newSubscription ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: oldSub && oldSub.options.applicationServerKey,
          }));

        const json = newSub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: newSub.endpoint,
            keys: {
              p256dh: json.keys && json.keys.p256dh,
              auth: json.keys && json.keys.auth,
            },
            userAgent: (self.navigator && self.navigator.userAgent) || undefined,
          }),
        });
      } catch (err) {
        console.error("pushsubscriptionchange 재구독 실패", err);
      }
    })()
  );
});
