"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCalendarDays,
  getWeekDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  ko,
} from "@/lib/utils/calendar";
import Link from "next/link";

interface Visit {
  id: string;
  scheduled_date: string;
  status: string;
  completed_at: string | null;
  method: string | null;
  user_id: string | null;
  clients: {
    id: string;
    name: string;
    facility_type: string;
    address: string | null;
  } | null;
}

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const res = await fetch(`/api/visits?year=${year}&month=${month}`);
    const data = await res.json();
    setVisits(data.visits || []);
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  function getVisitsForDate(date: Date): Visit[] {
    const dateStr = format(date, "yyyy-MM-dd");
    return visits.filter((v) => v.scheduled_date === dateStr);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return "bg-success";
      case "missed": return "bg-error";
      default: return "bg-primary";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "completed": return "완료";
      case "missed": return "미완료";
      default: return "예정";
    }
  }

  function handlePrev() {
    setCurrentDate((d) => subMonths(d, 1));
  }

  function handleNext() {
    setCurrentDate((d) => addMonths(d, 1));
  }

  const days = viewMode === "month"
    ? getCalendarDays(currentDate)
    : getWeekDays(selectedDate);

  const selectedVisits = getVisitsForDate(selectedDate);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="flex gap-6 h-full">
      {/* 좌측: 캘린더 */}
      <div className="flex-1">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">
              {format(currentDate, "yyyy년 M월", { locale: ko })}
            </h2>
            <div className="flex gap-1">
              <button onClick={handlePrev} className="btn btn-ghost btn-sm btn-square">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNext} className="btn btn-ghost btn-sm btn-square">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 월/주 토글 */}
          <div className="join">
            <button
              className={`join-item btn btn-sm ${viewMode === "month" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewMode("month")}
            >
              월
            </button>
            <button
              className={`join-item btn btn-sm ${viewMode === "week" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewMode("week")}
            >
              주
            </button>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div className="bg-base-100 rounded-lg border border-base-300">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-base-300">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  i === 0 ? "text-error" : i === 6 ? "text-primary" : "text-base-content/60"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayVisits = getVisitsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative min-h-24 p-1.5 border-b border-r border-base-300 text-left transition-colors hover:bg-base-200 ${
                    !isCurrentMonth ? "opacity-30" : ""
                  } ${isSelected ? "bg-base-200" : ""}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
                      isTodayDate
                        ? "bg-primary text-primary-content font-bold"
                        : day.getDay() === 0
                        ? "text-error"
                        : day.getDay() === 6
                        ? "text-primary"
                        : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>

                  {/* 방문 건 표시 */}
                  <div className="mt-0.5 space-y-0.5">
                    {dayVisits.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${getStatusColor(v.status)}`}
                      >
                        {v.clients?.name}
                      </div>
                    ))}
                    {dayVisits.length > 3 && (
                      <div className="text-[10px] text-base-content/50 px-1">
                        +{dayVisits.length - 3}건
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우측: 선택일 상세 */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="card bg-base-100 border border-base-300 sticky top-0">
          <div className="card-body">
            <h3 className="font-bold">
              {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
            </h3>
            <p className="text-sm text-base-content/50 mb-3">
              오늘 방문 예정 {selectedVisits.length}건
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-sm" />
              </div>
            ) : selectedVisits.length === 0 ? (
              <p className="text-sm text-base-content/40 py-4 text-center">
                예정된 방문이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {selectedVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    href={`/visits/${visit.id}`}
                    className="block p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
                  >
                    <div className="font-semibold text-sm">
                      {visit.clients?.name}
                    </div>
                    <div className="text-xs text-base-content/50 mt-0.5">
                      {visit.clients?.address || "주소 없음"}
                    </div>
                    <span
                      className={`badge badge-xs mt-1.5 text-white ${getStatusColor(visit.status)}`}
                    >
                      {getStatusLabel(visit.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* 상태 범례 */}
            <div className="mt-6 pt-4 border-t border-base-300">
              <p className="text-xs font-medium text-base-content/50 mb-2">
                상태 범례
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                  예정
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-success" />
                  완료
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-error" />
                  미완료
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
