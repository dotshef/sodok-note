"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { Spinner } from "@/components/ui/spinner";

interface DashboardData {
  todayCount: number;
  weekCount: number;
  missedCount: number;
  monthCompleted: number;
  todayVisits: {
    id: string;
    scheduled_date: string;
    status: string;
    clients: { id: string; name: string; facility_type: string } | null;
    users: { id: string; name: string } | null;
  }[];
  missedVisits: {
    id: string;
    scheduled_date: string;
    clients: { id: string; name: string } | null;
  }[];
  weeklyChart: {
    label: string;
    completed: number;
    scheduled: number;
    missed: number;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const loading = !data;

  useEffect(() => {
    let ignore = false;

    async function fetchDashboard() {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!ignore) {
        setData(json);
      }
    }

    fetchDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  function getFacilityLabel(typeId: string) {
    return FACILITY_TYPES.find((ft) => ft.id === typeId)?.label || typeId;
  }

  const [now] = useState(() => Date.now());

  function getDaysAgo(dateStr: string) {
    const diff = Math.floor(
      (now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  }

  function getStatusBadge(status: string) {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";
    switch (status) {
      case "completed":
        return <span className={`${base} bg-success/10 text-success`}>완료</span>;
      case "missed":
        return <span className={`${base} bg-error/10 text-error`}>미완료</span>;
      default:
        return <span className={`${base} bg-primary/10 text-primary`}>예정</span>;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const maxChartValue = Math.max(
    ...data.weeklyChart.map((d) => d.completed + d.scheduled + d.missed),
    1
  );

  return (
    <div>
      {/* 상단 요약 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.todayCount}건</p>
                <p className="text-base text-base-content/50">오늘 방문 예정</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <CalendarCheck size={20} className="text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.weekCount}건</p>
                <p className="text-base text-base-content/50">이번 주 예정</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-error" />
              </div>
              <div>
                <p className="text-2xl font-bold text-error">{data.missedCount}건</p>
                <p className="text-base text-base-content/50">미완료 건</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.monthCompleted}건</p>
                <p className="text-base text-base-content/50">이번 달 완료</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 좌측: 오늘 방문 예정 */}
        <div className="lg:col-span-2 rounded-xl bg-base-100 border border-base-300">
          <div className="p-6">
            <h3 className="text-base font-semibold mb-3">오늘 방문 예정</h3>
            {data.todayVisits.length === 0 ? (
              <p className="text-base text-base-content/40 py-4 text-center">
                오늘 예정된 방문이 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>고객명</th>
                      <th>시설 유형</th>
                      <th>담당 직원</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todayVisits.map((visit) => {
                      const client = visit.clients as unknown as { id: string; name: string; facility_type: string } | null;
                      const user = visit.users as unknown as { id: string; name: string } | null;
                      return (
                        <tr key={visit.id}>
                          <td>
                            <Link
                              href={`/visits/${visit.id}`}
                              className="text-primary hover:underline font-medium !text-base"
                            >
                              {client?.name || "-"}
                            </Link>
                          </td>
                          <td className="text-base">
                            {client ? getFacilityLabel(client.facility_type) : "-"}
                          </td>
                          <td className="text-base">{user?.name || "-"}</td>
                          <td>{getStatusBadge(visit.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 우측 */}
        <div className="space-y-4">
          {/* 미완료 건 */}
          <div className="rounded-xl bg-base-100 border border-base-300">
            <div className="p-6">
              <h3 className="text-base font-semibold mb-3">미완료 건</h3>
              {data.missedVisits.length === 0 ? (
                <p className="text-base text-base-content/40 py-2 text-center">
                  미완료 건이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {data.missedVisits.map((visit) => {
                    const client = visit.clients as unknown as { id: string; name: string } | null;
                    const daysAgo = getDaysAgo(visit.scheduled_date);
                    return (
                      <Link
                        key={visit.id}
                        href={`/visits/${visit.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-base font-medium">{client?.name || "-"}</p>
                          <p className="text-base text-base-content/50">
                            {visit.scheduled_date}
                          </p>
                        </div>
                        <span className="text-base text-error font-medium">
                          {daysAgo}일 경과
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 이번 주 요약 차트 */}
          <div className="rounded-xl bg-base-100 border border-base-300">
            <div className="p-6">
              <h3 className="text-base font-semibold mb-3">이번 주 요약</h3>
              <div className="flex items-end gap-2 h-32">
                {data.weeklyChart.map((day) => {
                  const total = day.completed + day.scheduled + day.missed;
                  const height = total > 0 ? (total / maxChartValue) * 100 : 4;
                  return (
                    <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-base font-medium">{total}</span>
                      <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${height}%` }}>
                        {day.completed > 0 && (
                          <div
                            className="bg-success"
                            style={{ height: `${(day.completed / total) * 100}%` }}
                          />
                        )}
                        {day.scheduled > 0 && (
                          <div
                            className="bg-primary"
                            style={{ height: `${(day.scheduled / total) * 100}%` }}
                          />
                        )}
                        {day.missed > 0 && (
                          <div
                            className="bg-error"
                            style={{ height: `${(day.missed / total) * 100}%` }}
                          />
                        )}
                        {total === 0 && <div className="bg-base-300 h-full" />}
                      </div>
                      <span className="text-base text-base-content/50">{day.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1 text-base">
                  <span className="w-2 h-2 rounded-sm bg-primary" /> 예정
                </div>
                <div className="flex items-center gap-1 text-base">
                  <span className="w-2 h-2 rounded-sm bg-success" /> 완료
                </div>
                <div className="flex items-center gap-1 text-base">
                  <span className="w-2 h-2 rounded-sm bg-error" /> 미완료
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
