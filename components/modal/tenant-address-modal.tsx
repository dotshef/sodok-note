"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";

interface TenantAddressModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TenantAddressModal({ open, onClose, onSaved }: TenantAddressModalProps) {
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAddress("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const trimmed = address.trim();
    if (!trimmed) {
      setError("주소를 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "저장에 실패했습니다");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="업체 주소 입력">
      <p className="text-base text-muted-foreground mb-4">
        증명서에 들어갈 업체 주소가 비어 있습니다. 주소를 입력하면 저장 후 바로 증명서가 생성됩니다.
      </p>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-3 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={<>업체 주소 <span className="text-destructive">*</span></>}>
          <input
            type="text"
            className="w-full"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예: 서울특별시 강남구 테헤란로 123"
            required
            autoFocus
          />
        </FormField>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? <Spinner size="sm" /> : "저장하고 증명서 생성"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
