"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
}

export function FilterSelect({ value, onChange, options, className }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  // 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // 키보드
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) {
          onChange(options[activeIndex].value);
        }
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }

  function handleSelect(optionValue: string) {
    if (optionValue !== value) onChange(optionValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} onKeyDown={handleKeyDown}>
      {/* 트리거 */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen(!open);
          if (!open) setActiveIndex(options.findIndex((o) => o.value === value));
        }}
        className="flex items-center justify-between gap-2 w-full h-10 px-3 rounded-lg border border-input bg-card text-base transition-colors hover:bg-muted cursor-pointer"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* 드롭다운 */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full min-w-36 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg py-1"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive = i === activeIndex;

            return (
              <li
                key={option.value === "" ? "__empty__" : option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-base cursor-pointer transition-colors ${
                  isActive ? "bg-muted" : ""
                }`}
              >
                <span className={isSelected ? "font-medium" : ""}>{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0 text-primary" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
