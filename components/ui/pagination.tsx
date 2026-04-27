"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// 현재 페이지 주변 + 양 끝 + ellipsis 패턴
function getPageItems(current: number, total: number): (number | "ellipsis-left" | "ellipsis-right")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // 항상 1, total은 표시
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", total];
  }
  if (current >= total - 3) {
    return [1, "ellipsis-left", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis-left", current - 1, current, current + 1, "ellipsis-right", total];
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const items = getPageItems(page, totalPages);

  const navBtn =
    "inline-flex items-center justify-center w-9 h-9 border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:hover:bg-card cursor-pointer disabled:cursor-not-allowed";
  const numberBtn =
    "inline-flex items-center justify-center w-9 h-9 border-y border-r border-border bg-card hover:bg-muted transition-colors text-base cursor-pointer";
  const numberBtnActive =
    "inline-flex items-center justify-center w-9 h-9 border-y border-r border-border bg-primary text-primary-foreground font-medium text-base cursor-default";
  const ellipsisSpan =
    "inline-flex items-center justify-center w-9 h-9 border-y border-r border-border bg-card text-muted-foreground text-base";

  return (
    <div className="flex justify-center mt-4">
      <div className="flex">
        <button
          className={`${navBtn} rounded-l-lg`}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="첫 페이지"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          className={`${navBtn} border-l-0`}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft size={16} />
        </button>

        {items.map((item, i) =>
          typeof item === "number" ? (
            <button
              key={i}
              className={item === page ? numberBtnActive : numberBtn}
              onClick={() => item !== page && onPageChange(item)}
              disabled={item === page}
              aria-label={`${item} 페이지`}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={i} className={ellipsisSpan} aria-hidden>
              …
            </span>
          )
        )}

        <button
          className={`${navBtn} border-l-0`}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className={`${navBtn} border-l-0 rounded-r-lg`}
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="마지막 페이지"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
