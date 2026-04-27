"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FACILITY_TYPES } from "@/constants/facility-types";
import { FACILITY_CATEGORIES } from "@/constants/facility-category";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { convertArea } from "@/utils/area";
import { FilterSelect } from "@/components/ui/filter-select";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    facilityCategory: "",
    facilityType: "",
    area: "",
    areaPyeong: "",
    volume: "",
    address: "",
    contactName: "",
    contactPhone: "",
    contactPosition: "",
    contactEmail: "",
  });
  const [clientCode, setClientCode] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchClient() {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) {
        router.push("/clients");
        return;
      }
      const data = await res.json();
      if (!ignore) {
        setForm({
          name: data.name || "",
          facilityCategory: data.facility_category || "",
          facilityType: data.facility_type || "",
          area: data.area?.toString() || "",
          areaPyeong: data.area_pyeong?.toString() || "",
          volume: data.volume?.toString() || "",
          address: data.address || "",
          contactName: data.contact_name || "",
          contactPhone: data.contact_phone || "",
          contactPosition: data.contact_position || "",
          contactEmail: data.contact_email || "",
        });
        setClientCode(data.code || "");
        setLoaded(true);
      }
    }

    fetchClient();

    return () => {
      ignore = true;
    };
  }, [id, router]);

  function updateField(field: string, value: string) {
    if (field === "area" || field === "areaPyeong") {
      setForm((prev) => ({ ...prev, ...convertArea(field, value) }));
    } else if (field === "facilityCategory") {
      setForm((prev) => ({
        ...prev,
        facilityCategory: value,
        facilityType: value === "mandatory" ? prev.facilityType : "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  }

  const isMandatory = form.facilityCategory === "mandatory";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          facilityType: form.facilityCategory === "mandatory" ? form.facilityType : null,
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

      router.push(`/clients/${id}`);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">고객 정보 수정</h2>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">시설 정보</h3>

            <FormField label="고객 코드">
              <p className="font-medium font-mono">{clientCode || "-"}</p>
            </FormField>

            <FormField label={<>시설명 <span className="text-destructive">*</span></>}>
              <input
                type="text"
                className="w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </FormField>

            <FormField label={<>시설 분류 <span className="text-destructive">*</span></>}>
              <FilterSelect
                value={form.facilityCategory}
                onChange={(v) => updateField("facilityCategory", v)}
                options={[
                  { value: "", label: "시설 분류 선택" },
                  ...FACILITY_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
                ]}
              />
            </FormField>

            {isMandatory && (
              <FormField label={<>의무 시설 유형 <span className="text-destructive">*</span></>}>
                <FilterSelect
                  value={form.facilityType}
                  onChange={(v) => updateField("facilityType", v)}
                  options={[
                    { value: "", label: "시설 유형 선택" },
                    ...FACILITY_TYPES.map((ft) => ({ value: ft.id, label: ft.label })),
                  ]}
                />
              </FormField>
            )}

            <FormField label={<>주소 <span className="text-destructive">*</span></>}>
              <input
                type="text"
                className="w-full"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                required
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
              <FormField label={<>담당자명 <span className="text-destructive">*</span></>}>
                <input
                  type="text"
                  className="w-full"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  required
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
              <FormField label={<>연락처 <span className="text-destructive">*</span></>}>
                <input
                  type="tel"
                  className="w-full"
                  value={form.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  required
                />
              </FormField>
            </div>

            <FormField label="이메일">
              <input
                type="email"
                placeholder="example@domain.com"
                className="w-full"
                value={form.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
              />
            </FormField>

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
            disabled={saving}
          >
            {saving ? <Spinner size="sm" /> : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
