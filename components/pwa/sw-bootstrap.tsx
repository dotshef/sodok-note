"use client";

import { useEffect } from "react";

export function ServiceWorkerBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;

    async function register() {
      try {
        const existing = await navigator.serviceWorker.getRegistration("/service-worker.js");
        if (!cancelled && !existing) {
          await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
        }
      } catch (err) {
        console.error("SW 등록 실패", err);
      }
    }

    register();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
