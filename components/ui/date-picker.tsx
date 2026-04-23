"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  min?: string;
  max?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  className,
  disabled,
  clearable = false,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const valueDate = useMemo(() => parseDate(value), [value]);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleConfirm(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  const hasValue = Boolean(valueDate);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`flex items-center justify-between gap-2 w-full h-10 px-3 rounded-lg border border-input bg-card text-base transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
        } ${className ?? ""}`}
      >
        <span className={`truncate ${hasValue ? "" : "text-muted-foreground"}`}>
          {hasValue ? value : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && hasValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="날짜 지우기"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="inline-flex items-center justify-center p-0.5 rounded hover:bg-muted-foreground/10 text-muted-foreground"
            >
              <X size={14} />
            </span>
          )}
          <Calendar size={16} className="text-muted-foreground" />
        </span>
      </button>

      {open && (
        <DatePickerModal
          value={valueDate}
          min={min ? parseDate(min) : null}
          max={max ? parseDate(max) : null}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

interface DatePickerModalProps {
  value: Date | null;
  min: Date | null;
  max: Date | null;
  onClose: () => void;
  onConfirm: (dateStr: string) => void;
}

function DatePickerModal({ value, min, max, onClose, onConfirm }: DatePickerModalProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selected, setSelected] = useState<Date | null>(value);
  const [viewYear, setViewYear] = useState((value ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((value ?? today).getMonth());

  // ESC 키 + body 스크롤 잠금
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    }
    // capture 단계로 등록해서 상위 모달의 ESC 핸들러보다 먼저 실행
    document.addEventListener("keydown", handleKey, { capture: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey, { capture: true });
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function isDisabled(d: Date) {
    if (min && d < min) return true;
    if (max && d > max) return true;
    return false;
  }

  function gotoPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function gotoNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function gotoToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelected(today);
  }

  // 42-cell grid: 이전 달 꼬리 + 이번 달 + 다음 달 머리
  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const gridStart = new Date(viewYear, viewMonth, 1 - startWeekday);
    const result: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      result.push(d);
    }
    return result;
  }, [viewYear, viewMonth]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="날짜 선택"
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 콘텐츠 — 모바일은 바텀시트, 데스크탑은 센터 모달 */}
      <div
        className="relative w-full sm:w-auto sm:min-w-80 rounded-t-2xl sm:rounded-xl bg-popover border border-border shadow-xl pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더: 월 네비게이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={gotoPrevMonth}
            className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="이전 달"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-base font-bold">
            {viewYear}년 {viewMonth + 1}월
          </div>
          <button
            type="button"
            onClick={gotoNextMonth}
            className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 px-2 pt-3">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-base font-medium py-1 ${
                i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === viewMonth;
            const isSelected = selected && isSameDay(d, selected);
            const isToday = isSameDay(d, today);
            const disabled = isDisabled(d);
            const weekday = d.getDay();

            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(d)}
                className={`h-10 rounded-lg text-base transition-colors cursor-pointer
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold"
                      : disabled
                        ? "opacity-30 cursor-not-allowed"
                        : !inMonth
                          ? "text-muted-foreground/50 hover:bg-muted"
                          : isToday
                            ? "font-bold text-primary hover:bg-muted"
                            : weekday === 0
                              ? "text-destructive hover:bg-muted"
                              : weekday === 6
                                ? "text-primary hover:bg-muted"
                                : "hover:bg-muted"
                  }
                `}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border">
          <button
            type="button"
            onClick={gotoToday}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            오늘
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onConfirm(formatDate(selected))}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              확정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
