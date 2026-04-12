"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { JwtPayload } from "@/lib/auth/jwt";

const pageTitles: Record<string, string> = {
  "/dashboard": "대시보드",
  "/calendar": "캘린더",
  "/visits": "방문 관리",
  "/clients": "고객 관리",
  "/certificates": "증명서",
  "/members": "직원 관리",
  "/settings": "설정",
};

export function Header({ session }: { session: JwtPayload }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="flex items-center gap-4">
        {session.role === "admin" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-primary/10 text-primary">관리자</span>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <span className="text-base">{session.email}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-10 w-40 p-2 bg-popover rounded-lg shadow-lg border border-border">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
