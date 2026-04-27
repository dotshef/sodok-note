"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  getPermissionState,
  isPushSupported,
  subscribeToPush,
} from "@/lib/push/subscription-manage";

const DISMISS_KEY = "push-banner-dismissed";

export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (getPermissionState() === "default") setVisible(true);
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    setWorking(true);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        setVisible(false);
      }
    } finally {
      setWorking(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="rounded-xl bg-primary/10 border border-primary/20 mb-4">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Bell size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold">푸시 알림을 받아보세요</p>
          <p className="text-base text-muted-foreground">
            방문 배정, 일정 알림을 기기에서 바로 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleEnable}
            disabled={working}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            {working ? "처리 중..." : "알림 허용"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="닫기"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
