"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  Users,
  Settings,
  UserPen,
  MessageSquare,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={22} /> },
  { href: "/calendar", label: "캘린더", icon: <Calendar size={22} /> },
  { href: "/visits", label: "방문 관리", icon: <ClipboardList size={22} /> },
  { href: "/clients", label: "고객 관리", icon: <Building2 size={22} />, adminOnly: true },
  { href: "/members", label: "직원 관리", icon: <Users size={22} />, adminOnly: true },
  { href: "/settings", label: "업체 설정", icon: <Settings size={22} /> },
];

export function Sidebar({ role }: { role: "admin" | "member" }) {
  const pathname = usePathname();
  const router = useRouter();

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-card border-r border-border">
      {/* 로고 */}
      <div className="px-6 py-5">
        <Link href="/dashboard" className="inline-block">
          <Image
            src="/logo-banner.png"
            alt="소독노트"
            width={300}
            height={200}
            priority
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 메뉴 */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/my-info"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
            pathname.startsWith("/my-info")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <UserPen size={22} />
          내 정보
        </Link>
        <Link
          href="/contact"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
            pathname.startsWith("/contact")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare size={22} />
          문의하기
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer w-full"
        >
          <LogOut size={22} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
