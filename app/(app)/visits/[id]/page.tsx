"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, Link as LinkIcon, Trash2, Send } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/components/providers/session-provider";
import { toast } from "sonner";
import { SendCertificateModal } from "@/components/certificates/send-certificate-modal";

interface VisitDetail {
  id: string;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  method: string | null;
  disinfectants_used: { name: string; quantity: string; unit: string }[] | null;
  notes: string | null;
  user_id: string | null;
  clients: {
    id: string;
    name: string;
    facility_category: string;
    facility_type: string | null;
    address: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
  } | null;
  certificates: {
    id: string;
    certificate_number: string;
    hwpx_file_url: string | null;
    hwpx_file_name: string | null;
    pdf_file_url: string | null;
    pdf_file_name: string | null;
    sent_at: string | null;
    sent_to: string | null;
  } | null;
}

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useSession();
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [method, setMethod] = useState("");
  const [disinfectants, setDisinfectants] = useState<{ name: string; quantity: string; unit: string }[]>([]);
  const [newDisinfectant, setNewDisinfectant] = useState("");
  const [notes, setNotes] = useState("");
  const [generatingCert, setGeneratingCert] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [issueNumber, setIssueNumber] = useState("1");
  const [recentMethods, setRecentMethods] = useState<{ id: string; name: string }[]>([]);
  const [recentDisinfectants, setRecentDisinfectants] = useState<{ id: string; name: string }[]>([]);

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
    setDisinfectants(data.disinfectants_used || []);
    setNotes(data.notes || "");
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const [visitRes, methodsRes, disinfectantsRes] = await Promise.all([
        fetch(`/api/visits/${id}`),
        fetch("/api/methods"),
        fetch("/api/disinfectants"),
      ]);
      if (!visitRes.ok) {
        router.push("/calendar");
        return;
      }
      const data = await visitRes.json();
      if (!ignore) {
        setVisit(data);
        setMethod(data.method || "");
        setDisinfectants(data.disinfectants_used || []);
        setNotes(data.notes || "");
        if (methodsRes.ok) setRecentMethods(await methodsRes.json());
        if (disinfectantsRes.ok) setRecentDisinfectants(await disinfectantsRes.json());
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id, router]);

  function addDisinfectant(name: string) {
    if (name.trim() && !disinfectants.some((d) => d.name === name.trim())) {
      setDisinfectants((prev) => [...prev, { name: name.trim(), quantity: "", unit: "EA" }]);
    }
    setNewDisinfectant("");
  }

  function removeDisinfectant(index: number) {
    setDisinfectants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDisinfectant(index: number, field: "name" | "quantity" | "unit", value: string) {
    setDisinfectants((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  async function handleComplete() {
    if (!confirm("소독 완료 처리하시겠습니까?")) return;
    setError("");
    setSaving(true);

    try {
      const finalMethod = method;
      const res = await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          method: finalMethod || null,
          disinfectantsUsed: disinfectants.length > 0 ? disinfectants : null,
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

  function handleOpenSendModal() {
    const clientEmail = visit?.clients?.contact_email;
    if (!clientEmail) {
      if (!confirm("시설 담당자 이메일이 등록되어 있지 않습니다. 지금 입력해서 발송하시겠습니까?")) {
        return;
      }
    }
    setSendModalOpen(true);
  }

  async function handleGenerateCert() {
    setGeneratingCert(true);
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: id, issueNumber: issueNumber || undefined }),
      });
      if (res.ok) {
        fetchVisit();
        toast.success("증명서가 생성되었습니다");
      } else {
        toast.error("증명서 생성에 실패했습니다");
      }
    } catch {
      toast.error("증명서 생성에 실패했습니다");
    } finally {
      setGeneratingCert(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 방문 기록을 삭제하시겠습니까? 관련 증명서도 함께 삭제됩니다.")) return;

    const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/visits");
    } else {
      const data = await res.json();
      setError(data.error || "삭제에 실패했습니다");
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!visit) return null;

  const isCompleted = visit.status === "completed";
  const today = format(new Date(), "yyyy-MM-dd");
  const isBeforeScheduled = !isCompleted && visit.scheduled_date > today;
  const badgeBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";

  return (
    <div className="max-w-3xl mx-auto">
      {/* 상단 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-bold flex-1">방문 상세</h2>
        <span
          className={`${badgeBase} ${
            visit.status === "completed"
              ? "bg-success/10 text-success"
              : visit.status === "missed"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {visit.status === "completed" ? "완료" : visit.status === "missed" ? "미완료" : "예정"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* 고객 정보 */}
      <div className="rounded-xl bg-card border border-border mb-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold">고객 정보</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-base mt-2">
            <div>
              <span className="text-muted-foreground">시설명</span>
              <p className="font-medium">
                <Link href={`/clients/${visit.clients?.id}`} className="text-primary hover:underline">
                  {visit.clients?.name}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">방문일</span>
              <p className="font-medium">{visit.scheduled_date}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">주소</span>
              <p className="font-medium">{visit.clients?.address || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">담당자명</span>
              <p className="font-medium">{visit.clients?.contact_name || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">연락처</span>
              <p className="font-medium">{visit.clients?.contact_phone || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 소독 정보 */}
      <div className="rounded-xl bg-card border border-border mb-4">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">소독 정보</h3>

          {isCompleted ? (
            <div className="space-y-4 text-base">
              <div>
                <span className="text-muted-foreground block mb-1">소독 방법</span>
                <p className="font-medium">{method || "-"}</p>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">사용 약품</span>
                {disinfectants.length > 0 ? (
                  <ul className="space-y-1">
                    {disinfectants.map((d, i) => (
                      <li key={i} className="font-medium">
                        {d.name}
                        {d.quantity && ` - ${d.quantity}${d.unit}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-medium">-</p>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">
                  방문 특이사항 <span className="font-normal text-sm">(소독증명서에 기재되지 않습니다)</span>
                </span>
                <p className="font-medium whitespace-pre-wrap">{notes || "-"}</p>
              </div>
            </div>
          ) : (
            <>
              {/* 소독 방법 */}
              <FormField label="소독 방법">
                <input
                  type="text"
                  placeholder="소독 방법 입력"
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  disabled={isBeforeScheduled}
                />
                {recentMethods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-muted-foreground text-sm mr-1">최근 사용:</span>
                    {recentMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="px-2.5 py-0.5 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setMethod(m.name)}
                        disabled={isBeforeScheduled}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </FormField>

              {/* 사용 약품 */}
              <FormField label="사용 약품">
                {disinfectants.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {disinfectants.map((d, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="flex-1 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          value={d.name}
                          onChange={(e) => updateDisinfectant(i, "name", e.target.value)}
                          placeholder="약품명"
                          disabled={isBeforeScheduled}
                        />
                        <input
                          type="text"
                          className="w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                          value={d.quantity}
                          onChange={(e) => updateDisinfectant(i, "quantity", e.target.value)}
                          placeholder="사용량"
                          disabled={isBeforeScheduled}
                        />
                        <select
                          className="w-20 min-h-[44px] px-2 py-2 rounded-lg border border-border text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          value={d.unit}
                          onChange={(e) => updateDisinfectant(i, "unit", e.target.value)}
                          disabled={isBeforeScheduled}
                        >
                          <option value="EA">EA</option>
                          <option value="cc">cc</option>
                          <option value="ml">ml</option>
                          <option value="L">L</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                        <button
                          type="button"
                          className="text-destructive hover:text-destructive/80 cursor-pointer p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => removeDisinfectant(i)}
                          disabled={isBeforeScheduled}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="약품명 입력 후 추가"
                    className="flex-1 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={newDisinfectant}
                    onChange={(e) => setNewDisinfectant(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDisinfectant(newDisinfectant))}
                    disabled={isBeforeScheduled}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-base font-medium border border-border hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => addDisinfectant(newDisinfectant)}
                    disabled={isBeforeScheduled}
                  >
                    추가
                  </button>
                </div>
                {recentDisinfectants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-muted-foreground text-sm mr-1">최근 사용:</span>
                    {recentDisinfectants.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="px-2.5 py-0.5 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => addDisinfectant(d.name)}
                        disabled={isBeforeScheduled}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </FormField>

              {/* 메모 */}
              <FormField label={<>방문 특이사항 <span className="text-muted-foreground font-normal text-sm">(소독증명서에 기재되지 않습니다)</span></>}>
                <textarea
                  className="w-full resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isBeforeScheduled}
                />
              </FormField>
            </>
          )}
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
        <div className="rounded-xl bg-card border border-border mb-4">
          <div className="py-4 px-6 space-y-4">
            <h3 className="font-semibold text-lg">소독증명서</h3>

            {/* 입력 (admin only) */}
            {role === "admin" && (
              <div className="space-y-2">
                <span className="text-muted-foreground text-base block mb-2">발급번호</span>
                <div className="flex flex-row items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-base">
                    제
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      className="w-20 min-h-[44px] px-3 py-2 rounded-lg border border-border text-base text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={issueNumber}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || Number(v) >= 1) setIssueNumber(v);
                      }}
                    />
                    호
                  </span>
                  <button
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-base font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                      visit.certificates
                        ? "border border-border hover:bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                    disabled={generatingCert}
                    onClick={handleGenerateCert}
                  >
                    {generatingCert ? (
                      <Spinner size="sm" />
                    ) : visit.certificates ? (
                      "증명서 재생성"
                    ) : (
                      "증명서 생성"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 파일 */}
            {(visit.certificates?.hwpx_file_url || visit.certificates?.pdf_file_url) && (
              <>
                <hr className="border-border" />
                <div className="space-y-2">
                  <span className="text-muted-foreground text-base block mb-2">파일</span>
                  {visit.certificates.hwpx_file_url && (
                    <a
                      href={`/api/certificates/${visit.certificates.id}/hwpx`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-base">
                        <FileText size={14} />
                        {visit.certificates.hwpx_file_name || `${visit.certificates.certificate_number}.hwpx`}
                      </span>
                      <Download size={14} className="text-muted-foreground" />
                    </a>
                  )}
                  {visit.certificates.pdf_file_url && (
                    <a
                      href={`/api/certificates/${visit.certificates.id}/pdf`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-base">
                        <FileText size={14} />
                        {visit.certificates.pdf_file_name || `${visit.certificates.certificate_number}.pdf`}
                      </span>
                      <Download size={14} className="text-muted-foreground" />
                    </a>
                  )}
                </div>
              </>
            )}

            {/* 이메일 발송 (admin only) */}
            {role === "admin" && visit.certificates?.pdf_file_url && (
              <>
                <hr className="border-border" />
                <div className="space-y-2">
                  <span className="text-muted-foreground text-base block mb-2">이메일 발송</span>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base text-muted-foreground flex-1 min-w-0">
                      {visit.certificates.sent_at && visit.certificates.sent_to ? (
                        <span className="break-all">
                          {format(new Date(visit.certificates.sent_at), "yyyy.MM.dd HH:mm")}
                          {" → "}
                          {visit.certificates.sent_to}
                          {" 발송됨"}
                        </span>
                      ) : (
                        <span>아직 발송되지 않았습니다</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-base font-medium transition-colors cursor-pointer ${
                        visit.certificates.sent_at
                          ? "border border-border hover:bg-muted"
                          : "bg-primary text-primary-foreground"
                      }`}
                      onClick={handleOpenSendModal}
                    >
                      <Send size={14} />
                      {visit.certificates.sent_at ? "재발송" : "발송"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {visit.certificates?.pdf_file_url && (
        <SendCertificateModal
          open={sendModalOpen}
          certificateId={visit.certificates.id}
          pdfFileName={visit.certificates.pdf_file_name || `${visit.certificates.certificate_number}.pdf`}
          defaultEmail={visit.clients?.contact_email || ""}
          clientHasEmail={Boolean(visit.clients?.contact_email)}
          onClose={() => setSendModalOpen(false)}
          onSent={() => fetchVisit()}
        />
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3 justify-end">
        {role === "admin" && (
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium border border-destructive text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            삭제
          </button>
        )}
        {!isCompleted ? (
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={handleComplete}
            disabled={saving || isBeforeScheduled}
            title={isBeforeScheduled ? `방문 예정일(${visit.scheduled_date}) 이후에 완료 처리할 수 있습니다` : undefined}
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium border border-destructive text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
