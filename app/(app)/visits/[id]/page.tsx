"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { DISINFECTION_METHODS, COMMON_CHEMICALS } from "@/lib/constants/methods";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

interface VisitDetail {
  id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  method: string | null;
  chemicals_used: string[] | null;
  notes: string | null;
  user_id: string | null;
  schedule_id: string | null;
  clients: {
    id: string;
    name: string;
    facility_type: string;
    address: string | null;
    contact_name: string | null;
    contact_phone: string | null;
  } | null;
  certificates: {
    id: string;
    certificate_number: string;
    pdf_url: string | null;
  } | null;
}

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [method, setMethod] = useState("");
  const [customMethod, setCustomMethod] = useState("");
  const [selectedChemicals, setSelectedChemicals] = useState<string[]>([]);
  const [customChemical, setCustomChemical] = useState("");
  const [notes, setNotes] = useState("");
  const [generatingCert, setGeneratingCert] = useState(false);

  const loading = !visit;

  async function fetchVisit() {
    const res = await fetch(`/api/visits/${id}`);
    if (!res.ok) {
      router.push("/calendar");
      return;
    }
    const data = await res.json();
    setVisit(data);
    setMethod(data.method || "");
    setSelectedChemicals(data.chemicals_used || []);
    setNotes(data.notes || "");
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const res = await fetch(`/api/visits/${id}`);
      if (!res.ok) {
        router.push("/calendar");
        return;
      }
      const data = await res.json();
      if (!ignore) {
        setVisit(data);
        setMethod(data.method || "");
        setSelectedChemicals(data.chemicals_used || []);
        setNotes(data.notes || "");
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id, router]);

  function toggleChemical(chem: string) {
    setSelectedChemicals((prev) =>
      prev.includes(chem) ? prev.filter((c) => c !== chem) : [...prev, chem]
    );
  }

  function addCustomChemical() {
    if (customChemical.trim() && !selectedChemicals.includes(customChemical.trim())) {
      setSelectedChemicals((prev) => [...prev, customChemical.trim()]);
      setCustomChemical("");
    }
  }

  async function handleComplete() {
    if (!confirm("소독 완료 처리하시겠습니까?")) return;
    setError("");
    setSaving(true);

    try {
      const finalMethod = method === "기타" ? customMethod : method;
      const res = await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          method: finalMethod || null,
          chemicalsUsed: selectedChemicals.length > 0 ? selectedChemicals : null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      fetchVisit();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateCert() {
    setGeneratingCert(true);
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: id }),
      });
      if (res.ok) fetchVisit();
    } catch {
      setError("증명서 생성에 실패했습니다");
    } finally {
      setGeneratingCert(false);
    }
  }

  async function handleUncomplete() {
    if (!confirm("완료를 취소하시겠습니까?")) return;

    const res = await fetch(`/api/visits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "uncomplete" }),
    });

    if (res.ok) fetchVisit();
  }

  function getFacilityLabel(typeId: string) {
    return FACILITY_TYPES.find((ft) => ft.id === typeId)?.label || typeId;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!visit) return null;

  const isCompleted = visit.status === "completed";
  const badgeBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";

  return (
    <div className="max-w-3xl mx-auto">
      {/* 상단 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-bold flex-1">방문 상세</h2>
        <span
          className={`${badgeBase} ${
            visit.status === "completed"
              ? "bg-success/10 text-success"
              : visit.status === "missed"
              ? "bg-error/10 text-error"
              : "bg-primary/10 text-primary"
          }`}
        >
          {visit.status === "completed" ? "완료" : visit.status === "missed" ? "미완료" : "예정"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-error/10 text-error border border-error/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* 고객 정보 */}
      <div className="rounded-xl bg-base-100 border border-base-300 mb-4">
        <div className="p-6">
          <h3 className="text-base font-semibold">고객 정보</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-base mt-2">
            <div>
              <span className="text-base-content/50">시설명</span>
              <p className="font-medium">
                <Link href={`/clients/${visit.clients?.id}`} className="text-primary hover:underline !text-lg">
                  {visit.clients?.name}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-base-content/50">시설 유형</span>
              <p className="font-medium">
                {visit.clients ? getFacilityLabel(visit.clients.facility_type) : "-"}
              </p>
            </div>
            <div>
              <span className="text-base-content/50">주소</span>
              <p className="font-medium">{visit.clients?.address || "-"}</p>
            </div>
            <div>
              <span className="text-base-content/50">예정일</span>
              <p className="font-medium">{visit.scheduled_date}</p>
            </div>
            <div>
              <span className="text-base-content/50">담당자</span>
              <p className="font-medium">{visit.clients?.contact_name || "-"}</p>
            </div>
            <div>
              <span className="text-base-content/50">연락처</span>
              <p className="font-medium">{visit.clients?.contact_phone || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 소독 정보 입력 */}
      <div className="rounded-xl bg-base-100 border border-base-300 mb-4">
        <div className="p-6 space-y-4">
          <h3 className="text-base font-semibold">소독 정보</h3>

          {/* 소독 방법 */}
          <FormField label="소독 방법">
            <div className="flex flex-wrap gap-2">
              {DISINFECTION_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                    method === m
                      ? "bg-primary text-primary-content"
                      : "border border-base-300 hover:bg-base-200"
                  }`}
                  onClick={() => setMethod(m)}
                  disabled={isCompleted}
                >
                  {m}
                </button>
              ))}
            </div>
            {method === "기타" && (
              <input
                type="text"
                placeholder="소독 방법 직접 입력"
                className="mt-2 w-full"
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                disabled={isCompleted}
              />
            )}
          </FormField>

          {/* 사용 약제 */}
          <FormField label="사용 약제">
            <div className="flex flex-wrap gap-2">
              {COMMON_CHEMICALS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                    selectedChemicals.includes(c)
                      ? "bg-primary text-primary-content"
                      : "border border-base-300 hover:bg-base-200"
                  }`}
                  onClick={() => toggleChemical(c)}
                  disabled={isCompleted}
                >
                  {c}
                </button>
              ))}
            </div>
            {!isCompleted && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="약제 직접 입력"
                  className="flex-1"
                  value={customChemical}
                  onChange={(e) => setCustomChemical(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomChemical())}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium border border-base-300 hover:bg-base-200 transition-colors cursor-pointer"
                  onClick={addCustomChemical}
                >
                  추가
                </button>
              </div>
            )}
            {selectedChemicals.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedChemicals.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-base font-medium bg-base-200 text-base-content">
                    {c}
                    {!isCompleted && (
                      <button onClick={() => toggleChemical(c)} className="text-base cursor-pointer">
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </FormField>

          {/* 메모 */}
          <FormField label="메모">
            <textarea
              className="w-full"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCompleted}
            />
          </FormField>
        </div>
      </div>

      {/* 완료 시 정보 */}
      {isCompleted && visit.completed_at && (
        <div className="rounded-xl bg-success/10 border border-success/30 mb-4">
          <div className="py-3 px-6">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle size={18} />
              <span className="font-medium text-base">
                {new Date(visit.completed_at).toLocaleString("ko-KR")} 완료
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 증명서 */}
      {isCompleted && (
        <div className="rounded-xl bg-base-100 border border-base-300 mb-4">
          <div className="py-4 px-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileText size={16} />
                소독증명서
              </h3>
              {visit.certificates ? (
                <div className="flex gap-2">
                  <span className="text-base text-base-content/60">
                    {visit.certificates.certificate_number}
                  </span>
                  {visit.certificates.pdf_url && (
                    <>
                      <a
                        href={visit.certificates.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-base font-medium hover:bg-base-200 transition-colors cursor-pointer"
                      >
                        <Download size={12} /> 다운로드
                      </a>
                      <button
                        className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-base font-medium hover:bg-base-200 transition-colors cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(visit.certificates!.pdf_url!);
                        }}
                      >
                        <LinkIcon size={12} /> 링크 복사
                      </button>
                    </>
                  )}
                  <button
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium border border-base-300 hover:bg-base-200 transition-colors disabled:opacity-50 cursor-pointer"
                    disabled={generatingCert}
                    onClick={handleGenerateCert}
                  >
                    재발급
                  </button>
                </div>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-content transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={generatingCert}
                  onClick={handleGenerateCert}
                >
                  {generatingCert ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <FileText size={14} /> 증명서 생성
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3 justify-end">
        {!isCompleted ? (
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-content transition-colors disabled:opacity-50 cursor-pointer"
            onClick={handleComplete}
            disabled={saving}
          >
            {saving ? (
              <Spinner size="sm" />
            ) : (
              <>
                <CheckCircle size={18} />
                소독 완료
              </>
            )}
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium border border-error text-error hover:bg-error/10 transition-colors cursor-pointer"
            onClick={handleUncomplete}
          >
            <XCircle size={14} />
            완료 취소
          </button>
        )}
      </div>
    </div>
  );
}
