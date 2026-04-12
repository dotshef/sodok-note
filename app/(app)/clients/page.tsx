"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { Spinner } from "@/components/ui/spinner";
import { FilterSelect } from "@/components/ui/filter-select";

interface Client {
  id: string;
  name: string;
  facility_type: string;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
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
  const [facilityType, setFacilityType] = useState("");
  const [page, setPage] = useState(1);

  const loading = !data;

  useEffect(() => {
    let ignore = false;

    async function fetchClients() {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (facilityType) params.set("facilityType", facilityType);
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
  }, [search, facilityType, page]);

  function getFacilityLabel(id: string) {
    return FACILITY_TYPES.find((ft) => ft.id === id)?.label || id;
  }

  return (
    <div>
      {/* 검색 + 필터 + 고객 등록 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex">
          <div className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-lg">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="시설명, 담당자명 검색"
            className="w-64 !rounded-l-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setData(null);
            }}
          />
        </div>
        <FilterSelect
          value={facilityType}
          onChange={(v) => { setFacilityType(v); setPage(1); setData(null); }}
          options={[
            { value: "", label: "전체 시설 유형" },
            ...FACILITY_TYPES.map((ft) => ({ value: ft.id, label: ft.label })),
          ]}
          className="w-80"
        />
        <Link href="/clients/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors cursor-pointer ml-auto">
          <Plus size={16} />
          고객 등록
        </Link>
      </div>

      {/* 테이블 */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>시설명</th>
              <th>시설 유형</th>
              <th>주소</th>
              <th>담당자</th>
              <th>연락처</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <Spinner size="md" />
                </td>
              </tr>
            ) : data?.clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  <td className="text-base">{getFacilityLabel(client.facility_type)}</td>
                  <td className="text-base">{client.address || "-"}</td>
                  <td className="text-base">{client.contact_name || "-"}</td>
                  <td className="text-base">{client.contact_phone || "-"}</td>
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
