"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const MAX_WIDTH_CLASS: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({ open, onClose, title, children, maxWidth = "lg" }: ModalProps) {
  const titleId = useId();

  // ESC 닫기 + body scroll lock
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className={`relative w-full ${MAX_WIDTH_CLASS[maxWidth]} rounded-xl bg-popover border border-border shadow-xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 id={titleId} className="text-lg font-bold">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
