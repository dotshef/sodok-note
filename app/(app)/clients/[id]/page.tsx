"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { FACILITY_TYPE_MAP, type FacilityTypeId } from "@/constants/facility-types";
import { getFacilityCategoryLabel } from "@/constants/facility-category";
import { getCycleMonths } from "@/utils/cycle";
import { Spinner } from "@/components/ui/spinner";

interface Visit {
  id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  method: string | null;
  disinfectants_used: { name: string; quantity: string; unit: string }[] | null;
  user_id: string | null;
  certificates: { id: string; certificate_number: string; hwpx_file_url: string | null; pdf_file_url: string | null } | null;
}

interface ClientDetail {
  id: string;
  name: string;
  facility_category: string;
  facility_type: string | null;
  area: number | null;
  area_pyeong: number | null;
  address: string | null;
  contact_name: string | null;
  contact_position: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  visits: Visit[];
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!client) return null;

  const isMandatory = client.facility_category === "mandatory";
  const cycleMonths = isMandatory && client.facility_type
    ? getCycleMonths(client.facility_type as FacilityTypeId)
    : null;
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
        <h2 className="text-2xl font-bold flex-1 min-w-0">
          {client.name}
          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium align-middle ${
            client.is_active
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}>
            {client.is_active ? "활성" : "비활성"}
          </span>
        </h2>
        <Link href={`/clients/${id}/edit`} aria-label="수정" className="inline-flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer">
          <Pencil size={18} className="md:hidden" />
          <Pencil size={14} className="hidden md:inline" />
          <span className="hidden md:inline">수정</span>
        </Link>
        <button onClick={handleToggleActive} aria-label={client.is_active ? "비활성화" : "활성화"} className={`inline-flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer ${
          client.is_active ? "text-destructive" : "text-success"
        }`}>
          <Trash2 size={18} className="md:hidden" />
          <Trash2 size={14} className="hidden md:inline" />
          <span className="hidden md:inline">{client.is_active ? "비활성화" : "활성화"}</span>
        </button>
      </div>

      {/* 상단 카드 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 좌측: 시설 정보 */}
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6">
            <h3 className="text-base font-semibold">시설 정보</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-base mt-2">
              <div>
                <span className="text-muted-foreground">시설 분류</span>
                <p className="font-medium">{getFacilityCategoryLabel(client.facility_category)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">의무소독시설 유형</span>
                <p className="font-medium">
                  {isMandatory && client.facility_type
                    ? FACILITY_TYPE_MAP.get(client.facility_type as FacilityTypeId)?.label ?? client.facility_type
                    : "-"}
                </p>
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
              <div className="col-span-2">
                <span className="text-muted-foreground">주소</span>
                <p className="font-medium">{client.address || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 시설 담당자 정보 */}
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6">
            <h3 className="text-base font-semibold">시설 담당자 정보</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-base mt-2">
              <div>
                <span className="text-muted-foreground">담당자명</span>
                <p className="font-medium">{client.contact_name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">직위</span>
                <p className="font-medium">{client.contact_position || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">연락처</span>
                <p className="font-medium">{client.contact_phone || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">이메일</span>
                <p className="font-medium break-all">{client.contact_email || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 방문 이력 */}
      <div className="mb-3">
        <h3 className="text-base font-semibold">방문 이력</h3>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {sortedVisits.length === 0 ? (
          <div className="rounded-xl bg-card border border-border py-8 text-center text-muted-foreground">
            방문 이력이 없습니다
          </div>
        ) : (
          sortedVisits.map((visit) => (
            <div key={visit.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <Link
                href={`/visits/${visit.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-medium">{visit.scheduled_date}</span>
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
                </div>
                <div className="text-base text-muted-foreground mb-1">
                  {visit.method || "-"}
                </div>
                <div className="text-base text-muted-foreground mb-1">
                  {visit.disinfectants_used?.map((d) => d.quantity ? `${d.name} ${d.quantity}${d.unit}` : d.name).join(", ") || "-"}
                </div>
                {visit.certificates?.certificate_number && (
                  <div className="text-base font-mono text-muted-foreground">
                    {visit.certificates.certificate_number}
                  </div>
                )}
              </Link>
              {visit.certificates && (
                <div className="flex border-t border-border">
                  {visit.certificates.hwpx_file_url ? (
                    <a
                      href={`/api/certificates/${visit.certificates.id}/hwpx`}
                      download
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium hover:bg-muted transition-colors border-r border-border"
                    >
                      HWPX
                    </a>
                  ) : (
                    <span className="flex-1 flex items-center justify-center py-3 text-base text-muted-foreground border-r border-border">
                      HWPX
                    </span>
                  )}
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
                    {visit.disinfectants_used?.map((d) => d.quantity ? `${d.name} ${d.quantity}${d.unit}` : d.name).join(", ") || "-"}
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
                    <div className="flex flex-wrap gap-1">
                      {visit.certificates?.hwpx_file_url && (
                        <a
                          href={`/api/certificates/${visit.certificates.id}/hwpx`}
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-base font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
                        >
                          HWPX
                        </a>
                      )}
                      {visit.certificates?.pdf_file_url && (
                        <a
                          href={`/api/certificates/${visit.certificates.id}/pdf`}
                          className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-base font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
