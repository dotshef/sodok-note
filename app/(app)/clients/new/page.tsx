"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { getCycleMonths } from "@/lib/utils/cycle";
import { FormField } from "@/components/ui/form-field";
import type { FacilityTypeId } from "@/lib/constants/facility-types";
import { Spinner } from "@/components/ui/spinner";
import { convertArea } from "@/lib/utils/area";
import { FilterSelect } from "@/components/ui/filter-select";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    facilityType: "",
    area: "",
    areaPyeong: "",
    volume: "",
    address: "",
    contactName: "",
    contactPhone: "",
    contactPosition: "",
  });

  function updateField(field: string, value: string) {
    if (field === "area" || field === "areaPyeong") {
      setForm((prev) => ({ ...prev, ...convertArea(field, value) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
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
          volume: form.volume ? Number(form.volume) : null,
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
        <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">시설 정보</h3>

            <FormField label={<>시설명 <span className="text-destructive">*</span></>}>
              <input
                type="text"
                placeholder=""
                className="w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </FormField>

            <FormField label={<>시설 유형 <span className="text-destructive">*</span></>}>
              <FilterSelect
                value={form.facilityType}
                onChange={(v) => updateField("facilityType", v)}
                options={[
                  { value: "", label: "시설 유형 선택" },
                  ...FACILITY_TYPES.map((ft) => ({ value: ft.id, label: ft.label })),
                ]}
              />
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

            <div className="grid grid-cols-3 gap-3">
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
              <FormField label="용적 (㎥)">
                <input
                  type="number"
                  className="w-full"
                  value={form.volume}
                  onChange={(e) => updateField("volume", e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border">
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">시설 담당자 정보</h3>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="담당자명">
                <input
                  type="text"
                  className="w-full"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </FormField>
              <FormField label="직위">
                <input
                  type="text"
                  placeholder="예: 점장, 대표"
                  className="w-full"
                  value={form.contactPosition}
                  onChange={(e) => updateField("contactPosition", e.target.value)}
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

          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
            onClick={() => router.back()}
          >
            취소
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
