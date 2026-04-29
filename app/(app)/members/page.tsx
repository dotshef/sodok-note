"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { RegisterFab } from "@/components/ui/register-fab";
import { Pagination } from "@/components/ui/pagination";
import { FilterSelect } from "@/components/ui/filter-select";
import { ConfirmModal } from "@/components/modal/confirm-modal";

interface Member {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
}

export default function MembersPage() {
  const { userId } = useSession();
  const [data, setData] = useState<MembersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [roleFilter, setRoleFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toggleTarget, setToggleTarget] = useState<Member | null>(null);

  const loading = !data;
  const members = data?.members;

  // 검색어 debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/members?${params}`);
      const json = await res.json();
      if (!ignore) {
        setData(json);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [page, debouncedSearch, roleFilter, refreshKey]);

  function fetchMembers() {
    setData(null);
    setRefreshKey((k) => k + 1);
  }

  function handleToggleActive(member: Member) {
    if (member.id === userId) return;
    setToggleTarget(member);
  }

  async function handleConfirmToggle() {
    if (!toggleTarget) return;
    const target = toggleTarget;
    setToggleTarget(null);

    if (target.is_active) {
      await fetch(`/api/members/${target.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/members/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
    }
    fetchMembers();
  }

  const badgeBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4 md:flex md:flex-wrap md:items-center md:gap-3">
        <div className="flex col-span-2 md:col-span-1">
          <div className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-lg">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="이름 검색"
            className="flex-1 min-w-0 md:flex-none md:w-56 !rounded-l-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <FilterSelect
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); setData(null); }}
          options={[
            { value: "", label: "전체" },
            { value: "admin", label: "관리자" },
            { value: "member", label: "직원" },
          ]}
          className="w-full md:w-36"
        />
        <RegisterFab label="직원 등록" href="/members/new" />
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border p-4">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        ) : members?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 멤버가 없습니다
          </div>
        ) : (
          members?.map((member) => (
            <div key={member.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-base">{member.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`${badgeBase} bg-muted text-foreground`}>
                      {member.role === "admin" ? "관리자" : "직원"}
                    </span>
                    <span className={`${badgeBase} ${
                      member.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>
                      {member.is_active ? "활성" : "비활성"}
                    </span>
                  </div>
                </div>
                <div className="text-base text-muted-foreground">{member.email}</div>
                {member.phone && (
                  <div className="text-base text-muted-foreground">{member.phone}</div>
                )}
              </div>
              <div className="flex border-t border-border">
                <Link
                  href={`/members/${member.id}/edit`}
                  className="flex-1 flex items-center justify-center py-3 text-base font-medium text-primary hover:bg-muted transition-colors border-r border-border"
                >
                  수정
                </Link>
                {member.id !== userId ? (
                  <button
                    onClick={() => handleToggleActive(member)}
                    className={`flex-1 flex items-center justify-center py-3 text-base font-medium transition-colors cursor-pointer ${
                      member.is_active ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10"
                    }`}
                  >
                    {member.is_active ? "비활성화" : "활성화"}
                  </button>
                ) : (
                  <span className="flex-1 flex items-center justify-center py-3 text-base text-muted-foreground">-</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 데스크탑 테이블 */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table data-table-truncate">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>이름</th>
              <th style={{ width: "22%" }}>이메일</th>
              <th style={{ width: "15%" }}>연락처</th>
              <th style={{ width: "10%" }}>역할</th>
              <th style={{ width: "10%" }}>상태</th>
              <th style={{ width: "13%" }}>등록일</th>
              <th style={{ width: "18%" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                {Array.from({ length: 7 }).map((_, i) => (
                  <td key={i}><div className="h-4 bg-muted rounded animate-pulse" /></td>
                ))}
              </tr>
            ) : members?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  등록된 멤버가 없습니다
                </td>
              </tr>
            ) : (
              members?.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">{member.name}</td>
                  <td className="text-base">{member.email}</td>
                  <td className="text-base">{member.phone || "-"}</td>
                  <td>
                    <span className={`${badgeBase} bg-muted text-foreground`}>
                      {member.role === "admin" ? "관리자" : "직원"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${badgeBase} ${
                        member.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {member.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="text-base">
                    {new Date(member.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link
                        href={`/members/${member.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        수정
                      </Link>
                      {member.id !== userId && (
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                            member.is_active ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10"
                          }`}
                        >
                          {member.is_active ? "비활성화" : "활성화"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={(p) => { setPage(p); setData(null); }}
        />
      )}

      <ConfirmModal
        open={toggleTarget !== null}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.is_active ? "직원 비활성화" : "직원 활성화"}
        description={
          toggleTarget
            ? `${toggleTarget.name}님을 ${toggleTarget.is_active ? "비활성화" : "활성화"}하시겠습니까?`
            : ""
        }
        confirmLabel={toggleTarget?.is_active ? "비활성화" : "활성화"}
        destructive={toggleTarget?.is_active === true}
      />
    </div>
  );
}
