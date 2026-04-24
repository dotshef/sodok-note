"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCalendarDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  ko,
} from "@/utils/calendar";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

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
    facility_category: string;
    facility_type: string | null;
    address: string | null;
  } | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visits, setVisits] = useState<Visit[] | null>(null);

  const loading = !visits;

  useEffect(() => {
    let ignore = false;

    async function fetchVisits() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/visits?year=${year}&month=${month}`);
      const data = await res.json();
      if (!ignore) {
        setVisits(data.visits || []);
      }
    }

    fetchVisits();

    return () => {
      ignore = true;
    };
  }, [currentDate]);

  function getVisitsForDate(date: Date): Visit[] {
    const dateStr = format(date, "yyyy-MM-dd");
    return (visits ?? []).filter((v) => v.scheduled_date === dateStr);
  }

  function getDayTextClass(day: Date, isTodayDate: boolean, isCurrentMonth: boolean) {
    if (isTodayDate) return "bg-primary text-primary-foreground font-bold";
    if (!isCurrentMonth) return "text-muted-foreground/60";
    if (day.getDay() === 0) return "text-destructive";
    if (day.getDay() === 6) return "text-primary";
    return "";
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return "bg-success";
      case "missed": return "bg-destructive";
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
    setVisits(null);
  }

  function handleNext() {
    setCurrentDate((d) => addMonths(d, 1));
    setVisits(null);
  }

  const days = getCalendarDays(currentDate);

  const selectedVisits = getVisitsForDate(selectedDate);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h2>
          <div className="flex gap-1">
            <button onClick={handlePrev} className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNext} className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더 + 방문 일정 가로 병렬 */}
      <div className="flex gap-6">
        {/* 캘린더 그리드 */}
        <div className="flex-1 bg-card rounded-lg border border-border">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-border">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-base font-medium ${
                  i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 — 데스크탑: 텍스트 표시, 모바일: dot 표시 */}
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
                  className={`relative md:min-h-35 min-h-20 p-1.5 border-b border-r border-border text-left transition-colors hover:bg-muted flex flex-col items-start cursor-pointer ${
                    isSelected ? "bg-muted" : ""
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-base ${getDayTextClass(day, isTodayDate, isCurrentMonth)}`}
                  >
                    {day.getDate()}
                  </span>

                  {/* 모바일: dot 표시 */}
                  {dayVisits.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 md:hidden">
                      {dayVisits.slice(0, 3).map((v) => (
                        <span
                          key={v.id}
                          className={`w-2 h-2 rounded-full ${getStatusColor(v.status)}`}
                        />
                      ))}
                      {dayVisits.length > 3 && (
                        <span className="text-base text-muted-foreground leading-none">+</span>
                      )}
                    </div>
                  )}

                  {/* 데스크탑: 텍스트 표시 */}
                  <div className="mt-0.5 space-y-0.5 hidden md:block w-full min-w-0">
                    {dayVisits.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className={`text-base px-1 py-0.5 rounded truncate text-white ${getStatusColor(v.status)}`}
                      >
                        {v.clients?.name}
                      </div>
                    ))}
                    {dayVisits.length > 3 && (
                      <div className="text-base text-muted-foreground px-1">
                        +{dayVisits.length - 3}건
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우측: 선택일 상세 (데스크탑) */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="rounded-xl bg-card border border-border sticky top-0">
            <div className="p-6">
              <h3 className="font-bold text-lg">
                {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
              </h3>
              <p className="text-base mb-3">
                방문 일정 {selectedVisits.length}건
              </p>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : selectedVisits.length === 0 ? (
                <p className="text-base text-muted-foreground py-4 text-center">
                  예정된 방문이 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedVisits.map((visit) => (
                    <Link
                      key={visit.id}
                      href={`/visits/${visit.id}`}
                      className="block p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-base">
                        {visit.clients?.name}
                      </div>
                      <div className="text-base text-muted-foreground mt-0.5">
                        {visit.clients?.address || "주소 없음"}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium mt-1.5 text-white ${getStatusColor(visit.status)}`}
                      >
                        {getStatusLabel(visit.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* 모바일: 선택일 일정 목록 */}
      <div className="lg:hidden mt-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-bold text-base mb-3">
            {format(selectedDate, "M월 d일 (EEE)", { locale: ko })} · {selectedVisits.length}건
          </h3>

          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : selectedVisits.length === 0 ? (
            <p className="text-base text-muted-foreground py-4 text-center">
              예정된 방문이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {selectedVisits.map((visit) => (
                <Link
                  key={visit.id}
                  href={`/visits/${visit.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div>
                    <div className="font-medium text-base">{visit.clients?.name}</div>
                    <div className="text-base text-muted-foreground">{visit.clients?.address || "주소 없음"}</div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium text-white shrink-0 ${getStatusColor(visit.status)}`}
                  >
                    {getStatusLabel(visit.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
