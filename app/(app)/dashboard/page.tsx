"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { InstallBanner } from "@/components/pwa/install-banner";

interface DashboardData {
  todayCount: number;
  weekCount: number;
  missedCount: number;
  monthCompleted: number;
  todayVisits: {
    id: string;
    visit_code: string | null;
    scheduled_date: string;
    status: string;
    clients: { id: string; name: string; address: string | null } | null;
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

  const [now] = useState(() => Date.now());
  const [todayStr] = useState(() => new Date().toISOString().split("T")[0]);

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
        return <span className={`${base} bg-destructive/10 text-destructive`}>미완료</span>;
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

  const nowDate = new Date();
  const weekStart = format(startOfWeek(nowDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(nowDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(nowDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(nowDate), "yyyy-MM-dd");

  const cardClass = "rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer";

  return (
    <div>
      <InstallBanner />
      {/* 상단 요약 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          href={`/visits?date_from=${todayStr}&date_to=${todayStr}`}
          className={cardClass}
        >
          <div className="p-4 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar size={22} strokeWidth={2} className="text-primary" />
            </div>
            <p className="text-base text-foreground">오늘 방문 일정</p>
            <p className="text-2xl font-bold">{data.todayCount}건</p>
          </div>
        </Link>

        <Link
          href={`/visits?date_from=${weekStart}&date_to=${weekEnd}`}
          className={cardClass}
        >
          <div className="p-4 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <CalendarCheck size={22} strokeWidth={2} className="text-info" />
            </div>
            <p className="text-base text-foreground">이번 주 일정</p>
            <p className="text-2xl font-bold">{data.weekCount}건</p>
          </div>
        </Link>

        <Link
          href="/visits?status=missed"
          className={cardClass}
        >
          <div className="p-4 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={22} strokeWidth={2} className="text-destructive" />
            </div>
            <p className="text-base text-foreground">미완료 건</p>
            <p className="text-2xl font-bold text-destructive">{data.missedCount}건</p>
          </div>
        </Link>

        <Link
          href={`/visits?status=completed&date_from=${monthStart}&date_to=${monthEnd}`}
          className={cardClass}
        >
          <div className="p-4 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle size={22} strokeWidth={2} className="text-success" />
            </div>
            <p className="text-base text-foreground">이번 달 완료</p>
            <p className="text-2xl font-bold">{data.monthCompleted}건</p>
          </div>
        </Link>
      </div>

      {/* 하단 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 좌측: 오늘 방문 예정 */}
        <div className="lg:col-span-2 rounded-xl bg-card border border-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3">오늘 방문 예정</h3>
            {data.todayVisits.length === 0 ? (
              <p className="text-base text-muted-foreground py-4 text-center">
                오늘 예정된 방문이 없습니다
              </p>
            ) : (
              <>
                {/* 모바일 카드 */}
                <div className="md:hidden space-y-3">
                  {data.todayVisits.map((visit) => {
                    const client = visit.clients as unknown as { id: string; name: string; address: string | null } | null;
                    const user = visit.users as unknown as { id: string; name: string } | null;
                    return (
                      <Link
                        key={visit.id}
                        href={`/visits/${visit.id}`}
                        className="block rounded-xl bg-card border border-border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-base text-primary">
                            {visit.visit_code || "-"}
                          </span>
                          {getStatusBadge(visit.status)}
                        </div>
                        {client && (
                          <div className="text-base font-medium mb-1">{client.name}</div>
                        )}
                        {client?.address && (
                          <div className="text-base text-muted-foreground mb-1">{client.address}</div>
                        )}
                        {user?.name && (
                          <div className="text-base text-muted-foreground">{user.name}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* 데스크탑 테이블 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="data-table data-table-truncate">
                    <thead>
                      <tr>
                        <th style={{ width: "18%" }}>방문 코드</th>
                        <th style={{ width: "20%" }}>시설명</th>
                        <th style={{ width: "27%" }}>주소</th>
                        <th style={{ width: "15%" }}>담당 직원</th>
                        <th style={{ width: "20%" }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.todayVisits.map((visit) => {
                        const client = visit.clients as unknown as { id: string; name: string; address: string | null } | null;
                        const user = visit.users as unknown as { id: string; name: string } | null;
                        return (
                          <tr key={visit.id}>
                            <td>
                              <Link
                                href={`/visits/${visit.id}`}
                                className="text-primary hover:underline font-medium !text-base"
                              >
                                {visit.visit_code || "-"}
                              </Link>
                            </td>
                            <td>
                              {client ? (
                                <Link
                                  href={`/clients/${client.id}`}
                                  className="text-primary hover:underline font-medium !text-base"
                                >
                                  {client.name}
                                </Link>
                              ) : "-"}
                            </td>
                            <td className="text-base">{client?.address || "-"}</td>
                            <td className="text-base">{user?.name || "-"}</td>
                            <td>{getStatusBadge(visit.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 우측 */}
        <div className="space-y-4">
          {/* 미완료 건 */}
          <div className="rounded-xl bg-card border border-border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-3">미완료 건</h3>
              {data.missedVisits.length === 0 ? (
                <p className="text-base text-muted-foreground py-2 text-center">
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
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-base font-medium">{client?.name || "-"}</p>
                          <p className="text-base text-muted-foreground">
                            {visit.scheduled_date}
                          </p>
                        </div>
                        <span className="text-base text-destructive font-medium">
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
          <div className="rounded-xl bg-card border border-border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-3">이번 주 요약</h3>
              <div className="flex gap-2 h-32">
                {data.weeklyChart.map((day) => {
                  const total = day.completed + day.scheduled + day.missed;
                  const height = total > 0 ? (total / maxChartValue) * 100 : 4;
                  return (
                    <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-base font-medium">{total}</span>
                      <div className="w-full flex-1 flex flex-col justify-end">
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
                            className="bg-destructive"
                            style={{ height: `${(day.missed / total) * 100}%` }}
                          />
                        )}
                        {total === 0 && <div className="bg-border h-full" />}
                      </div>
                      </div>
                      <span className="text-base text-muted-foreground">{day.label}</span>
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
                  <span className="w-2 h-2 rounded-sm bg-destructive" /> 미완료
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
