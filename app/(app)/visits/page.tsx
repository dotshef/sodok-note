"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { VisitCreateModal } from "@/components/visits/visit-create-modal";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePicker } from "@/components/ui/date-picker";
import { useSession } from "@/components/providers/session-provider";

interface Visit {
  id: string;
  visit_code: string | null;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  method: string | null;
  disinfectants_used: { name: string; quantity: string; unit: string }[] | null;
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
  certificates: {
    id: string;
    certificate_number: string;
    pdf_file_url: string | null;
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
      <div className="grid grid-cols-2 gap-2 mb-4 md:flex md:flex-wrap md:items-center md:gap-3">
        <div className="flex col-span-2 md:col-span-1">
          <div className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-lg">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="시설명 검색"
            className="flex-1 min-w-0 md:flex-none md:w-56 !rounded-l-none"
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
          className="w-full md:w-36"
        />

        <FilterSelect
          value={facilityTypeFilter}
          onChange={(v) => { setFacilityTypeFilter(v); setPage(1); setData(null); }}
          options={[
            { value: "", label: "전체 시설 유형" },
            ...FACILITY_TYPES.map((ft) => ({ value: ft.id, label: ft.label })),
          ]}
          className="w-full md:w-56"
        />

        <div className="contents md:flex md:items-center md:gap-2">
          <DatePicker
            value={dateFrom}
            onChange={(v) => {
              setDateFrom(v);
              setPage(1);
              setData(null);
            }}
            placeholder="시작일"
            clearable
            className="md:w-40"
          />
          <span className="hidden md:inline text-muted-foreground">~</span>
          <DatePicker
            value={dateTo}
            onChange={(v) => {
              setDateTo(v);
              setPage(1);
              setData(null);
            }}
            placeholder="종료일"
            clearable
            min={dateFrom || undefined}
            className="md:w-40"
          />
        </div>

        {role === "admin" && (
          <FilterSelect
            value={userIdFilter}
            onChange={(v) => { setUserIdFilter(v); setPage(1); setData(null); }}
            options={[
              { value: "", label: "전체 담당자" },
              ...activeMembers.map((m) => ({ value: m.id, label: m.name })),
            ]}
            className="col-span-2 w-full md:col-span-1 md:w-40"
          />
        )}

        {role === "admin" && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="방문 일정 등록"
            className="fixed z-40 right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] size-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground transition-colors cursor-pointer md:static md:ml-auto md:h-auto md:w-auto md:rounded-lg md:shadow-none md:px-4 md:py-2 md:gap-2"
          >
            <Plus className="w-6 h-6 md:w-4 md:h-4" />
            <span className="hidden md:inline text-base font-medium">방문 일정 등록</span>
          </button>
        )}
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
        ) : data?.visits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            조건에 해당하는 방문 일정이 없습니다
          </div>
        ) : (
          data?.visits.map((visit) => (
            <div key={visit.id} className="rounded-xl bg-card border border-border overflow-hidden">
              {/* 상단: 방문 상세 링크 */}
              <Link
                href={`/visits/${visit.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-mono text-muted-foreground">{visit.visit_code || "-"}</span>
                  {getStatusBadge(visit.status)}
                </div>
                <div className="font-medium text-base mb-1">{visit.clients?.name || "-"}</div>
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <span>{visit.clients ? getFacilityLabel(visit.clients.facility_type) : "-"}</span>
                  <span>·</span>
                  <span>{visit.scheduled_date}</span>
                  {visit.users?.name && (
                    <>
                      <span>·</span>
                      <span>{visit.users.name}</span>
                    </>
                  )}
                </div>
              </Link>
              {/* 하단: 다운로드 버튼 */}
              {visit.certificates && (
                <div className="flex border-t border-border">
                  <a
                    href={`/api/certificates/${visit.certificates.id}/hwpx`}
                    download
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium hover:bg-muted transition-colors border-r border-border"
                  >
                    HWPX
                  </a>
                  {visit.certificates.pdf_file_url ? (
                    <a
                      href={`/api/certificates/${visit.certificates.id}/pdf`}
                      download
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium hover:bg-muted transition-colors"
                    >
                      PDF
                    </a>
                  ) : (
                    <span className="flex-1 flex items-center justify-center py-3 text-base text-muted-foreground">
                      PDF
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 데스크탑 테이블 */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>코드</th>
              <th style={{ width: "13%" }}>시설명</th>
              <th style={{ width: "19%" }}>시설 유형</th>
              <th style={{ width: "10%" }}>담당자</th>
              <th style={{ width: "10%" }}>상태</th>
              <th style={{ width: "11%" }}>날짜</th>
              <th style={{ width: "19%" }}>증명서</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                {Array.from({ length: 7 }).map((_, i) => (
                  <td key={i}><div className="h-4 bg-muted rounded animate-pulse" /></td>
                ))}
              </tr>
            ) : data?.visits.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  조건에 해당하는 방문 일정이 없습니다
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
                  <td>
                    {visit.certificates ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-base font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => window.open(`/api/certificates/${visit.certificates!.id}/hwpx`)}
                        >
                          HWPX
                        </button>
                        {visit.certificates.pdf_file_url && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-base font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => window.open(`/api/certificates/${visit.certificates!.id}/pdf`)}
                          >
                            PDF
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="block text-center text-base text-muted-foreground">-</span>
                    )}
                  </td>
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
