"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Menu,
  X,
  Building2,
  Users,
  Settings,
  UserPen,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const mainTabs: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={22} /> },
  { href: "/calendar", label: "캘린더", icon: <Calendar size={22} /> },
  { href: "/visits", label: "방문관리", icon: <ClipboardList size={22} /> },
];

const moreItems: NavItem[] = [
  { href: "/clients", label: "고객 관리", icon: <Building2 size={22} />, adminOnly: true },
  { href: "/members", label: "직원 관리", icon: <Users size={22} />, adminOnly: true },
  { href: "/settings", label: "업체 설정", icon: <Settings size={22} /> },
  { href: "/my-info", label: "내 정보", icon: <UserPen size={22} /> },
];

export function BottomNav({ role }: { role: "admin" | "member" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const filteredMoreItems = moreItems.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  const isMoreActive = filteredMoreItems.some((item) => pathname.startsWith(item.href));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* 더보기 오버레이 */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-x-0 top-0 bottom-16 z-40 bg-black/40 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border rounded-t-2xl p-4 space-y-1 lg:hidden">
            {filteredMoreItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer w-full"
            >
              <LogOut size={22} />
              로그아웃
            </button>
          </div>
        </>
      )}

      {/* 하단 탭 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.icon}
                <span className="text-base font-medium">{tab.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] transition-colors cursor-pointer ${
              isMoreActive || moreOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {moreOpen ? <X size={22} /> : <Menu size={22} />}
            <span className="text-base font-medium">더보기</span>
          </button>
        </div>
      </nav>
    </>
  );
}
