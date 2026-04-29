"use client";

import type { ReactNode } from "react";
import { Modal } from "../ui/modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  confirmDisabled = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="md">
      {description && <p className="text-base whitespace-pre-wrap">{description}</p>}
      {children}
      <div className="flex gap-3 justify-end mt-5">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            destructive
              ? "bg-destructive text-destructive-foreground hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
