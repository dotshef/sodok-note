"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";

interface Client {
  id: string;
  name: string;
  facility_type: string;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  schedules: { next_visit_date: string }[];
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

  function getNextVisitDate(client: Client) {
    const schedule = client.schedules?.[0];
    return schedule?.next_visit_date || "-";
  }

  return (
    <div>
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold"></h2>
        <Link href="/clients/new" className="btn btn-primary gap-2">
          <Plus size={16} />
          고객 등록
        </Link>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="join">
          <div className="join-item flex items-center px-3 bg-base-200">
            <Search size={16} className="text-base-content/40" />
          </div>
          <input
            type="text"
            placeholder="시설명, 담당자명 검색"
            className="input input-bordered input-md w-64"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setData(null);
            }}
          />
        </div>
        <select
          className="select select-bordered select-md"
          value={facilityType}
          onChange={(e) => {
            setFacilityType(e.target.value);
            setPage(1);
            setData(null);
          }}
        >
          <option value="">전체 시설 유형</option>
          {FACILITY_TYPES.map((ft) => (
            <option key={ft.id} value={ft.id}>
              {ft.label}
            </option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
        <table className="table table-md">
          <thead>
            <tr>
              <th>시설명</th>
              <th>시설 유형</th>
              <th>주소</th>
              <th>담당자</th>
              <th>연락처</th>
              <th>다음 방문일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : data?.clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-base-content/50">
                  등록된 고객이 없습니다
                </td>
              </tr>
            ) : (
              data?.clients.map((client) => (
                <tr key={client.id} className="hover">
                  <td className="!text-base">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="text-base">{getFacilityLabel(client.facility_type)}</td>
                  <td className="text-base">{client.address || "-"}</td>
                  <td className="text-base">{client.contact_name || "-"}</td>
                  <td className="text-base">{client.contact_phone || "-"}</td>
                  <td className="text-base">{getNextVisitDate(client)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="join">
            <button
              className="join-item btn btn-md"
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); setData(null); }}
            >
              <ChevronLeft size={16} />
            </button>
            <button className="join-item btn btn-md btn-disabled">
              {page} / {data.totalPages}
            </button>
            <button
              className="join-item btn btn-md"
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
