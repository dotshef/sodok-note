"use client";

import { usePathname } from "next/navigation";
import type { JwtPayload } from "@/lib/auth/jwt";

const pageTitles: Record<string, string> = {
  "/dashboard": "대시보드",
  "/calendar": "캘린더",
  "/visits": "방문 관리",
  "/clients": "고객 관리",
  "/members": "직원 관리",
  "/settings": "업체 설정",
  "/my-info": "내 정보",
};

export function Header({ session }: { session: JwtPayload }) {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="flex items-center gap-4">
        {session.role === "admin" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-primary/10 text-primary">관리자</span>
        )}
        <span className="text-base font-medium">{session.email}</span>
      </div>
    </header>
  );
}
