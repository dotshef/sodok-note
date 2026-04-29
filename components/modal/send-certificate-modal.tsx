"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";

interface SendCertificateModalProps {
  open: boolean;
  certificateId: string;
  pdfFileName: string;
  defaultEmail: string;
  clientHasEmail: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export function SendCertificateModal({
  open,
  certificateId,
  pdfFileName,
  defaultEmail,
  clientHasEmail,
  onClose,
  onSent,
}: SendCertificateModalProps) {
  const [email, setEmail] = useState("");
  const [updateClientEmail, setUpdateClientEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setUpdateClientEmail(!clientHasEmail);
      setError("");
    }
  }, [open, defaultEmail, clientHasEmail]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("수신자 이메일을 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/certificates/${certificateId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: trimmed, updateClientEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "발송에 실패했습니다");
        return;
      }
      toast.success("증명서가 발송되었습니다");
      onSent?.();
      onClose();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="증명서 이메일 발송">
      {error && (
        <div className="flex items-center gap-3 rounded-lg p-3 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={<>수신자 이메일 <span className="text-destructive">*</span></>}>
          <input
            type="email"
            className="w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            required
            autoFocus
          />
        </FormField>

        <label className="flex items-center gap-2 text-base cursor-pointer">
          <input
            type="checkbox"
            checked={updateClientEmail}
            onChange={(e) => setUpdateClientEmail(e.target.checked)}
          />
          <span>이 이메일로 시설 담당자 정보도 함께 업데이트</span>
        </label>

        <div className="rounded-lg border border-border p-3 flex items-center gap-2 text-base bg-muted/40">
          <FileText size={16} className="text-muted-foreground" />
          <span className="break-all">{pdfFileName}</span>
        </div>

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
            {submitting ? <Spinner size="sm" /> : "발송"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
