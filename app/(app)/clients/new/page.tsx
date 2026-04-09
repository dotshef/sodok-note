"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { getCycleMonths } from "@/lib/utils/cycle";
import { FormField } from "@/components/ui/form-field";
import type { FacilityTypeId } from "@/lib/constants/facility-types";
import { Spinner } from "@/components/ui/spinner";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    facilityType: "",
    area: "",
    areaPyeong: "",
    address: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    firstVisitDate: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedCycle = form.facilityType
    ? getCycleMonths(form.facilityType as FacilityTypeId)
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          area: form.area ? Number(form.area) : null,
          areaPyeong: form.areaPyeong ? Number(form.areaPyeong) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/clients/${data.id}`);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">고객 등록</h2>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-error/10 text-error border border-error/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">시설 정보</h3>

            <FormField label={<>시설명 <span className="text-error">*</span></>}>
              <input
                type="text"
                placeholder=""
                className="w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </FormField>

            <FormField label={<>시설 유형 <span className="text-error">*</span></>}>
              <select
                className="w-full"
                value={form.facilityType}
                onChange={(e) => updateField("facilityType", e.target.value)}
                required
              >
                <option value="">시설 유형 선택</option>
                {FACILITY_TYPES.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.label}
                  </option>
                ))}
              </select>
              {selectedCycle && (
                <p className="text-base text-primary mt-1">
                  법정 소독 주기: {selectedCycle}개월
                </p>
              )}
            </FormField>

            <FormField label="주소">
              <input
                type="text"
                placeholder="시설 주소"
                className="w-full"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="면적 (㎡)">
                <input
                  type="number"
                  className="w-full"
                  value={form.area}
                  onChange={(e) => updateField("area", e.target.value)}
                />
              </FormField>
              <FormField label="면적 (평)">
                <input
                  type="number"
                  className="w-full"
                  value={form.areaPyeong}
                  onChange={(e) => updateField("areaPyeong", e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">담당자 정보</h3>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="담당자명">
                <input
                  type="text"
                  className="w-full"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </FormField>
              <FormField label="연락처">
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  className="w-full"
                  value={form.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="메모">
              <textarea
                className="w-full"
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="p-6">
            <h3 className="font-semibold">방문 스케줄</h3>

            <FormField label={<>첫 방문 예정일 <span className="text-error">*</span></>}>
              <input
                type="date"
                className="w-full"
                value={form.firstVisitDate}
                onChange={(e) => updateField("firstVisitDate", e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-base-200 transition-colors"
            onClick={() => router.back()}
          >
            취소
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-content transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
