export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

const SW_PATH = "/sw.js";

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error("VAPID public key가 설정되지 않았습니다");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await getServiceWorkerRegistration();

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(publicKey),
    });
  }

  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
      userAgent: navigator.userAgent,
    }),
  });

  return res.ok;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) return true;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return true;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });

  return true;
}

export async function getCurrentSubscriptionEndpoint(): Promise<string | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) return null;
  const subscription = await registration.pushManager.getSubscription();
  return subscription?.endpoint ?? null;
}
