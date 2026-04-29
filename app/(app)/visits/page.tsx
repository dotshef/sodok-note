"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { RegisterFab } from "@/components/ui/register-fab";
import { VisitCreateModal } from "@/components/modal/visit-create-modal";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Pagination } from "@/components/ui/pagination";
import { VisitStatusBadge } from "@/components/ui/visit-status-badge";
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
  client_id: string;
  client_name: string;
  client_address: string | null;
  client_facility_category: string;
  client_facility_type: string | null;
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
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, userIdFilter, page, refreshKey]);

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

        {role === "admin" && (
          <FilterSelect
            value={userIdFilter}
            onChange={(v) => { setUserIdFilter(v); setPage(1); setData(null); }}
            options={[
              { value: "", label: "전체 직원" },
              ...activeMembers.map((m) => ({ value: m.id, label: m.name })),
            ]}
            className="w-full md:w-40"
          />
        )}

        {role === "admin" && (
          <RegisterFab label="방문 일정 등록" onClick={() => setCreateOpen(true)} />
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
                  <VisitStatusBadge status={visit.status} />
                </div>
                <div className="font-medium text-base mb-1">{visit.client_name || "-"}</div>
                {visit.client_address && (
                  <div className="text-base text-muted-foreground">{visit.client_address}</div>
                )}
                <div className="text-base text-muted-foreground">{visit.scheduled_date}</div>
                {visit.users?.name && (
                  <div className="text-base text-muted-foreground">{visit.users.name}</div>
                )}
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
        <table className="data-table data-table-truncate">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>방문 코드</th>
              <th style={{ width: "13%" }}>시설명</th>
              <th style={{ width: "19%" }}>주소</th>
              <th style={{ width: "10%" }}>방문 직원</th>
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
                  <td className="text-base font-medium">{visit.client_name || "-"}</td>
                  <td className="text-base">{visit.client_address || "-"}</td>
                  <td className="text-base">{visit.users?.name || "-"}</td>
                  <td><VisitStatusBadge status={visit.status} /></td>
                  <td className="text-base">{visit.scheduled_date}</td>
                  <td>
                    {visit.certificates ? (
                      <div className="flex flex-wrap gap-1 justify-center">
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
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={(p) => {
            setPage(p);
            setData(null);
          }}
        />
      )}
    </div>
  );
}
