"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FACILITY_TYPES, FACILITY_TYPE_MAP, type FacilityTypeId } from "@/constants/facility-types";
import { FACILITY_CATEGORIES, getFacilityCategoryLabel } from "@/constants/facility-category";
import { FilterSelect } from "@/components/ui/filter-select";

interface Client {
  id: string;
  name: string;
  facility_category: string;
  facility_type: string | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ClientsPage() {
  const [data, setData] = useState<ClientsResponse | null>(null);
  const [search, setSearch] = useState("");
  const [facilityCategory, setFacilityCategory] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [page, setPage] = useState(1);

  const loading = !data;
  const showTypeFilter = facilityCategory === "mandatory";

  useEffect(() => {
    let ignore = false;

    async function fetchClients() {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (facilityCategory) params.set("facilityCategory", facilityCategory);
      if (facilityCategory === "mandatory" && facilityType) params.set("facilityType", facilityType);
      params.set("page", String(page));

      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      if (!ignore) {
        setData(json);
      }
    }

    fetchClients();

    return () => {
      ignore = true;
    };
  }, [search, facilityCategory, facilityType, page]);

  return (
    <div>
      {/* 검색 + 필터 + 고객 등록 */}
      <div className="grid grid-cols-2 gap-2 mb-4 md:flex md:flex-wrap md:items-center md:gap-3">
        <div className="flex col-span-2 md:col-span-1">
          <div className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-lg">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="시설명, 담당자명 검색"
            className="flex-1 min-w-0 md:flex-none md:w-64 !rounded-l-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setData(null);
            }}
          />
        </div>
        <FilterSelect
          value={facilityCategory}
          onChange={(v) => {
            setFacilityCategory(v);
            if (v !== "mandatory") setFacilityType("");
            setPage(1);
            setData(null);
          }}
          options={[
            { value: "", label: "전체 시설 분류" },
            ...FACILITY_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
          ]}
          className="w-full md:w-40"
        />
        {showTypeFilter && (
          <FilterSelect
            value={facilityType}
            onChange={(v) => { setFacilityType(v); setPage(1); setData(null); }}
            options={[
              { value: "", label: "전체 의무 시설" },
              ...FACILITY_TYPES.map((ft) => ({ value: ft.id, label: ft.label })),
            ]}
            className="w-full md:w-80"
          />
        )}
        <Link
          href="/clients/new"
          aria-label="고객 등록"
          className="fixed z-40 right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] size-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground transition-colors cursor-pointer md:static md:ml-auto md:h-auto md:w-auto md:rounded-lg md:shadow-none md:px-4 md:py-2 md:gap-2"
        >
          <Plus className="w-6 h-6 md:w-4 md:h-4" />
          <span className="hidden md:inline text-base font-medium">고객 등록</span>
        </Link>
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
        ) : data?.clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 고객이 없습니다
          </div>
        ) : (
          data?.clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block rounded-xl bg-card border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-base">{client.name}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium ${
                  client.is_active
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {client.is_active ? "활성" : "비활성"}
                </span>
              </div>
              <div className="text-base text-muted-foreground mb-1">
                {getFacilityCategoryLabel(client.facility_category)}
                {client.facility_category === "mandatory" && client.facility_type && (
                  <>
                    {" / "}
                    {FACILITY_TYPE_MAP.get(client.facility_type as FacilityTypeId)?.label ?? client.facility_type}
                  </>
                )}
              </div>
              {client.address && (
                <div className="text-base text-muted-foreground mb-1">{client.address}</div>
              )}
              {client.contact_name && (
                <div className="text-base text-muted-foreground">{client.contact_name}</div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* 데스크탑 테이블 */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table data-table-truncate">
          <thead>
            <tr>
              <th style={{ width: "14%" }}>시설명</th>
              <th style={{ width: "11%" }}>시설 분류</th>
              <th style={{ width: "22%" }}>의무소독시설 유형</th>
              <th style={{ width: "30%" }}>주소</th>
              <th style={{ width: "13%" }}>담당자명</th>
              <th style={{ width: "10%" }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <td key={i}><div className="h-4 bg-muted rounded animate-pulse" /></td>
                ))}
              </tr>
            ) : data?.clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  등록된 고객이 없습니다
                </td>
              </tr>
            ) : (
              data?.clients.map((client) => (
                <tr key={client.id}>
                  <td className="!text-base">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-primary hover:underline !text-base"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="text-base">{getFacilityCategoryLabel(client.facility_category)}</td>
                  <td className="text-base">
                    {client.facility_category === "mandatory" && client.facility_type
                      ? FACILITY_TYPE_MAP.get(client.facility_type as FacilityTypeId)?.label ?? client.facility_type
                      : "-"}
                  </td>
                  <td className="text-base">{client.address || "-"}</td>
                  <td className="text-base">{client.contact_name || "-"}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium ${
                      client.is_active
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {client.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex">
            <button
              className="inline-flex items-center justify-center p-2 border border-border bg-card rounded-l-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); setData(null); }}
            >
              <ChevronLeft size={16} />
            </button>
            <button className="px-4 py-2 border-y border-border bg-card text-base" disabled>
              {page} / {data.totalPages}
            </button>
            <button
              className="inline-flex items-center justify-center p-2 border border-border bg-card rounded-r-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              disabled={page >= data.totalPages}
              onClick={() => { setPage(page + 1); setData(null); }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
