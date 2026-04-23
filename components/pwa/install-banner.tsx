"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/lib/pwa/install";

const DISMISS_KEY = "install-banner-dismissed";

export function InstallBanner() {
  const router = useRouter();
  const state = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;
  if (state.status === "installed" || state.status === "unsupported") return null;

  const { title, body, cta, onClick } =
    state.status === "available"
      ? {
          title: "앱으로 설치하기",
          body: "홈 화면에 추가하면 더 빠르게 이용할 수 있어요",
          cta: working ? "처리 중..." : "설치",
          onClick: async () => {
            setWorking(true);
            try {
              const ok = await state.install();
              if (ok) setDismissed(true);
            } finally {
              setWorking(false);
            }
          },
        }
      : {
          title: "iPhone에서 앱처럼 사용",
          body: "알림을 받으시려면 앱을 다운받으세요",
          cta: "설치 방법 보기",
          onClick: () => router.push("/install"),
        };

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative rounded-xl bg-primary/10 border border-primary/20 mb-4">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="닫기"
        className="absolute top-2 right-2 inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted cursor-pointer"
      >
        <X size={18} />
      </button>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 pr-10">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Download size={18} className="text-primary" />
          </div>
          <p className="text-base font-semibold">{title}</p>
        </div>
        <p className="text-base text-muted-foreground">{body}</p>
        <button
          type="button"
          onClick={onClick}
          disabled={working}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-base font-medium bg-primary text-primary-foreground disabled:opacity-50 cursor-pointer"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
