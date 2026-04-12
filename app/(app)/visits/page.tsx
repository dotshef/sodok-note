"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { Spinner } from "@/components/ui/spinner";
import { VisitCreateModal } from "@/components/visits/visit-create-modal";
import { FilterSelect } from "@/components/ui/filter-select";
import { useSession } from "@/components/providers/session-provider";

interface Visit {
  id: string;
  visit_code: string | null;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  method: string | null;
  chemicals_used: string[] | null;
  notes: string | null;
  user_id: string | null;
  clients: {
    id: string;
    name: string;
    facility_type: string;
    address: string | null;
  } | null;
  users: {
    id: string;
    name: string;
  } | null;
}

interface VisitsResponse {
  visits: Visit[];
  total: number;
  page: number;
  totalPages: number;
}

interface Member {
  id: string;
  name: string;
  is_active: boolean;
}

export default function VisitsPage() {
  const { role } = useSession();
  const searchParams = useSearchParams();

  const [data, setData] = useState<VisitsResponse | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const [userIdFilter, setUserIdFilter] = useState(searchParams.get("user_id") || "");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState(searchParams.get("facility_type") || "");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loading = !data;

  // 검색어 debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 담당자 목록 (admin만)
  useEffect(() => {
    if (role !== "admin") return;
    let ignore = false;

    async function load() {
      const res = await fetch("/api/members");
      const json = await res.json();
      if (!ignore) {
        setMembers(json.members || []);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [role]);

  // 방문 목록 fetch
  useEffect(() => {
    let ignore = false;

    async function fetchVisits() {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (userIdFilter) params.set("user_id", userIdFilter);
      if (facilityTypeFilter) params.set("facility_type", facilityTypeFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/visits?${params}`);
      const json = await res.json();
      if (!ignore) {
        setData(json);
      }
    }

    fetchVisits();
    return () => {
      ignore = true;
    };
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, userIdFilter, facilityTypeFilter, page, refreshKey]);

  function getFacilityLabel(typeId: string) {
    return FACILITY_TYPES.find((ft) => ft.id === typeId)?.label || typeId;
  }

  const badgeBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <span className={`${badgeBase} bg-success/10 text-success`}>완료</span>;
      case "missed":
        return <span className={`${badgeBase} bg-destructive/10 text-destructive`}>미완료</span>;
      default:
        return <span className={`${badgeBase} bg-primary/10 text-primary`}>예정</span>;
    }
  }

  const activeMembers = members.filter((m) => m.is_active);

  return (
    <div>
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex">
          <div className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-lg">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="시설명 검색"
            className="w-56 !rounded-l-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <FilterSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); setData(null); }}
          options={[
            { value: "", label: "전체 상태" },
            { value: "scheduled", label: "예정" },
            { value: "completed", label: "완료" },
            { value: "missed", label: "미완료" },
          ]}
          className="w-36"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
              setData(null);
            }}
          />
          <span className="text-muted-foreground">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
              setData(null);
            }}
          />
        </div>

        <FilterSelect
          value={facilityTypeFilter}
          onChange={(v) => { setFacilityTypeFilter(v); setPage(1); setData(null); }}
          options={[
            { value: "", label: "전체 시설 유형" },
            ...FACILITY_TYPES.map((ft) => ({ value: ft.id, label: ft.label })),
          ]}
          className="w-56"
        />

        {role === "admin" && (
          <FilterSelect
            value={userIdFilter}
            onChange={(v) => { setUserIdFilter(v); setPage(1); setData(null); }}
            options={[
              { value: "", label: "전체 담당자" },
              ...activeMembers.map((m) => ({ value: m.id, label: m.name })),
            ]}
            className="w-40"
          />
        )}

        {role === "admin" && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors cursor-pointer ml-auto"
          >
            <Plus size={16} />
            방문 일정 등록
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>코드</th>
              <th>시설명</th>
              <th>시설 유형</th>
              <th>담당자</th>
              <th>상태</th>
              <th>날짜</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Spinner size="md" />
                </td>
              </tr>
            ) : data?.visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  방문 이력이 없습니다
                </td>
              </tr>
            ) : (
              data?.visits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    {visit.visit_code ? (
                      <Link
                        href={`/visits/${visit.id}`}
                        className="font-medium text-primary hover:underline !text-base font-mono"
                      >
                        {visit.visit_code}
                      </Link>
                    ) : (
                      <span className="text-base text-muted-foreground">-</span>
                    )}
                  </td>
                  <td>
                    {visit.clients ? (
                      <Link
                        href={`/clients/${visit.clients.id}`}
                        className="font-medium text-primary hover:underline !text-base"
                      >
                        {visit.clients.name}
                      </Link>
                    ) : (
                      <span className="text-base">-</span>
                    )}
                  </td>
                  <td className="text-base">
                    {visit.clients ? getFacilityLabel(visit.clients.facility_type) : "-"}
                  </td>
                  <td className="text-base">{visit.users?.name || "-"}</td>
                  <td>{getStatusBadge(visit.status)}</td>
                  <td className="text-base">{visit.scheduled_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 방문 일정 등록 모달 */}
      {role === "admin" && (
        <VisitCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setData(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex">
            <button
              className="inline-flex items-center justify-center p-2 border border-border bg-card rounded-l-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              disabled={page <= 1}
              onClick={() => {
                setPage(page - 1);
                setData(null);
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="px-4 py-2 border-y border-border bg-card text-base"
              disabled
            >
              {page} / {data.totalPages}
            </button>
            <button
              className="inline-flex items-center justify-center p-2 border border-border bg-card rounded-r-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              disabled={page >= data.totalPages}
              onClick={() => {
                setPage(page + 1);
                setData(null);
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
