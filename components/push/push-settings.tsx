"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";
import {
  getCurrentSubscriptionEndpoint,
  getPermissionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/browser";
import { Spinner } from "@/components/ui/spinner";

interface DeviceRow {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

function formatUserAgent(ua: string | null): string {
  if (!ua) return "알 수 없는 기기";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return ua.slice(0, 30);
}

export function PushSettings() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const loading = supported === null || devices === null;

  useEffect(() => {
    let ignore = false;

    async function init() {
      const ok = isPushSupported();
      const perm = getPermissionState();
      const endpoint = ok ? await getCurrentSubscriptionEndpoint() : null;
      const res = await fetch("/api/push/subscriptions");
      const list: DeviceRow[] = res.ok ? await res.json() : [];

      if (!ignore) {
        setSupported(ok);
        setPermission(perm);
        setCurrentEndpoint(endpoint);
        setDevices(list);
      }
    }

    init();
    return () => { ignore = true; };
  }, []);

  async function reloadDevices() {
    const endpoint = await getCurrentSubscriptionEndpoint();
    setCurrentEndpoint(endpoint);
    const res = await fetch("/api/push/subscriptions");
    setDevices(res.ok ? await res.json() : []);
    setPermission(getPermissionState());
  }

  async function handleEnable() {
    setError("");
    setWorking(true);
    try {
      const ok = await subscribeToPush();
      if (!ok) {
        setError("알림 허용이 필요합니다. 브라우저 설정에서 확인해주세요.");
        return;
      }
      await reloadDevices();
    } catch (e) {
      console.error(e);
      setError("알림 설정에 실패했습니다");
    } finally {
      setWorking(false);
    }
  }

  async function handleDisable() {
    setError("");
    setWorking(true);
    try {
      await unsubscribeFromPush();
      await reloadDevices();
    } catch (e) {
      console.error(e);
      setError("알림 해제에 실패했습니다");
    } finally {
      setWorking(false);
    }
  }

  async function handleRemoveDevice(endpoint: string) {
    setError("");
    const isCurrent = endpoint === currentEndpoint;
    if (isCurrent) {
      await handleDisable();
      return;
    }
    const res = await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    if (res.ok) {
      await reloadDevices();
    } else {
      setError("기기 삭제에 실패했습니다");
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border mb-4">
        <div className="p-6 flex justify-center">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="rounded-xl bg-card border border-border mb-4">
        <div className="p-6">
          <h3 className="text-base font-semibold mb-2">푸시 알림</h3>
          <p className="text-base text-muted-foreground">
            이 브라우저에서는 푸시 알림을 지원하지 않습니다.
            iOS는 홈 화면에 추가된 상태에서만 알림을 받을 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  const isSubscribed = !!currentEndpoint;

  return (
    <div className="rounded-xl bg-card border border-border mb-4">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">푸시 알림</h3>
            <p className="text-base text-muted-foreground">
              {permission === "denied"
                ? "브라우저에서 알림이 차단되었습니다. 설정에서 허용해주세요."
                : isSubscribed
                  ? "이 기기에서 알림을 받고 있습니다"
                  : "이 기기에서 알림을 받지 않습니다"}
            </p>
          </div>
          {permission !== "denied" && (
            <button
              type="button"
              onClick={isSubscribed ? handleDisable : handleEnable}
              disabled={working}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium disabled:opacity-50 cursor-pointer ${
                isSubscribed
                  ? "border border-border hover:bg-muted"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {working ? (
                <Spinner size="sm" />
              ) : isSubscribed ? (
                <><BellOff size={16} /> 해제</>
              ) : (
                <><Bell size={16} /> 허용</>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg p-3 bg-destructive/10 text-destructive border border-destructive/20 text-base">
            {error}
          </div>
        )}

        {devices.length > 0 && (
          <div>
            <p className="text-base font-medium mb-2">등록된 기기</p>
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {devices.map((d) => {
                const isCurrent = d.endpoint === currentEndpoint;
                return (
                  <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-base font-medium truncate">
                        {formatUserAgent(d.user_agent)}
                        {isCurrent && <span className="ml-2 text-primary">(현재 기기)</span>}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {new Date(d.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDevice(d.endpoint)}
                      aria-label="기기 삭제"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted text-destructive cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
