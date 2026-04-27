"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Modal } from "@/components/ui/modal";

interface ClientOption {
  id: string;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
  is_active: boolean;
}

interface VisitCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (visitId: string) => void;
}

export function VisitCreateModal({ open, onClose, onCreated }: VisitCreateModalProps) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [members, setMembers] = useState<MemberOption[] | null>(null);

  const [clientId, setClientId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 고객/담당자 목록 로드
  useEffect(() => {
    if (!open) return;
    let ignore = false;

    async function load() {
      const [clientsRes, membersRes] = await Promise.all([
        fetch("/api/clients?active=true&limit=500"),
        fetch("/api/members"),
      ]);
      const clientsJson = await clientsRes.json();
      const membersJson = await membersRes.json();
      if (!ignore) {
        setClients(clientsJson.clients || []);
        setMembers(membersJson.members || []);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [open]);

  // 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      setClientId("");
      setScheduledDate("");
      setUserId("");
      setNotes("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!clientId) {
      setError("고객 시설을 선택해주세요");
      return;
    }
    if (!scheduledDate) {
      setError("방문 예정일을 선택해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          scheduledDate,
          userId: userId || null,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "등록에 실패했습니다");
        return;
      }
      onCreated?.(data.id);
      onClose();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  const activeMembers = (members || []).filter((m) => m.is_active);

  return (
    <Modal open={open} onClose={onClose} title="방문 일정 등록">
      {error && (
        <div className="flex items-center gap-3 rounded-lg p-3 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={<>고객 시설 <span className="text-destructive">*</span></>}>
          <FilterSelect
            value={clientId}
            onChange={setClientId}
            options={[
              { value: "", label: clients === null ? "불러오는 중..." : "시설 선택" },
              ...(clients || []).map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <p className="text-base text-muted-foreground mt-1">
            새로운 고객의 일정인가요?{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/clients/new");
              }}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              새 고객 등록
            </button>
          </p>
        </FormField>

        <FormField label={<>방문 예정일 <span className="text-destructive">*</span></>}>
          <DatePicker
            value={scheduledDate}
            onChange={setScheduledDate}
            placeholder="날짜 선택"
          />
        </FormField>

        <FormField label="담당 기사">
          <FilterSelect
            value={userId}
            onChange={setUserId}
            options={[
              { value: "", label: "미배정" },
              ...activeMembers.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        </FormField>

        <FormField label="메모">
          <textarea
            className="w-full"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            placeholder="사전 전달사항 (선택)"
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
            {submitting ? <Spinner size="sm" /> : "등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
