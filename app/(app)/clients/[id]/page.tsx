"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { FACILITY_TYPES, type FacilityTypeId } from "@/lib/constants/facility-types";
import { getCycleMonths } from "@/lib/utils/cycle";
import { Spinner } from "@/components/ui/spinner";

interface Visit {
  id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  method: string | null;
  chemicals_used: string[] | null;
  user_id: string | null;
  certificates: { id: string; certificate_number: string; file_url: string | null } | null;
}

interface ClientDetail {
  id: string;
  name: string;
  facility_type: string;
  area: number | null;
  area_pyeong: number | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_active: boolean;
  visits: Visit[];
  stats: {
    totalVisits: number;
    completionRate: number;
    certificateCount: number;
  };
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);

  const loading = !client;

  useEffect(() => {
    let ignore = false;

    async function fetchClient() {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) {
        router.push("/clients");
        return;
      }
      const data = await res.json();
      if (!ignore) {
        setClient(data);
      }
    }

    fetchClient();

    return () => {
      ignore = true;
    };
  }, [id, router]);

  async function handleToggleActive() {
    const action = client?.is_active ? "비활성화" : "활성화";
    if (!confirm(`이 고객을 ${action}하시겠습니까?`)) return;

    if (client?.is_active) {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
    }

    const res = await fetch(`/api/clients/${id}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
    }
  }

  function getFacilityLabel(typeId: string) {
    return FACILITY_TYPES.find((ft) => ft.id === typeId)?.label || typeId;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!client) return null;

  const cycleMonths = getCycleMonths(client.facility_type as FacilityTypeId);
  const sortedVisits = [...(client.visits || [])].sort(
    (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
  );

  const badgeBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";

  return (
    <div>
      {/* 상단 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
          <ArrowLeft size={18} />
        </Link>
        <h2 className="text-2xl font-bold flex-1">
          {client.name}
          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium align-middle ${
            client.is_active
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}>
            {client.is_active ? "활성" : "비활성"}
          </span>
        </h2>
        <Link href={`/clients/${id}/edit`} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer">
          <Pencil size={14} /> 수정
        </Link>
        <button onClick={handleToggleActive} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer ${
          client.is_active ? "text-destructive" : "text-success"
        }`}>
          <Trash2 size={14} /> {client.is_active ? "비활성화" : "활성화"}
        </button>
      </div>

      {/* 상단 카드 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* 좌측: 시설 정보 */}
        <div className="lg:col-span-2 rounded-xl bg-card border border-border">
          <div className="p-6">
            <h3 className="text-base font-semibold">시설 정보</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-base mt-2">
              <div>
                <span className="text-muted-foreground">시설 유형</span>
                <p className="font-medium">{getFacilityLabel(client.facility_type)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">주소</span>
                <p className="font-medium">{client.address || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">면적</span>
                <p className="font-medium">
                  {client.area ? `${client.area}㎡` : "-"}
                  {client.area_pyeong ? ` (${client.area_pyeong}평)` : ""}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">소독 주기</span>
                <p className="font-medium">
                  {cycleMonths ? `${cycleMonths}개월` : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">시설 담당자</span>
                <p className="font-medium">{client.contact_name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">연락처</span>
                <p className="font-medium">{client.contact_phone || "-"}</p>
              </div>

            </div>
          </div>
        </div>

        {/* 우측: 요약 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border border-border">
            <div className="h-full py-6 px-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-bold">{client.stats.totalVisits}</p>
              <p className="text-base text-muted-foreground">총 방문</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border">
            <div className="h-full py-6 px-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-bold">{client.stats.completionRate}%</p>
              <p className="text-base text-muted-foreground">완료율</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border">
            <div className="h-full py-6 px-4 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-bold">{client.stats.certificateCount}</p>
              <p className="text-base text-muted-foreground">증명서</p>
            </div>
          </div>
        </div>
      </div>

      {/* 방문 이력 테이블 */}
      <div className="rounded-xl bg-card border border-border">
        <div className="p-6">
          <h3 className="text-base font-semibold mb-3">방문 이력</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>날짜</th>
                  <th style={{ width: "18%" }}>소독 방법</th>
                  <th style={{ width: "27%" }}>사용 약제</th>
                  <th style={{ width: "12%" }}>상태</th>
                  <th style={{ width: "13%" }}>증명서</th>
                  <th style={{ width: "15%" }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedVisits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      방문 이력이 없습니다
                    </td>
                  </tr>
                ) : (
                  sortedVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="text-base">{visit.scheduled_date}</td>
                      <td className="text-base">{visit.method || "-"}</td>
                      <td className="text-base">
                        {visit.chemicals_used?.join(", ") || "-"}
                      </td>
                      <td>
                        <span
                          className={`${badgeBase} ${
                            visit.status === "completed"
                              ? "bg-success/10 text-success"
                              : visit.status === "missed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {visit.status === "completed"
                            ? "완료"
                            : visit.status === "missed"
                            ? "미완료"
                            : "예정"}
                        </span>
                      </td>
                      <td className="text-base">
                        {visit.certificates?.certificate_number || "-"}
                      </td>
                      <td>
                        {visit.certificates?.file_url && (
                          <a
                            href={`/api/certificates/${visit.certificates.id}/download`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
                          >
                            <FileText size={14} />
                            다운로드
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
