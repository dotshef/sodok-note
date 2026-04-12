"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/members");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">직원 등록</h2>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6 space-y-4">
            <FormField label={<>이름 <span className="text-destructive">*</span></>}>
              <input
                type="text"
                className="w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </FormField>

            <FormField label={<>이메일 <span className="text-destructive">*</span></>}>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </FormField>

            <FormField label={<>비밀번호 <span className="text-destructive">*</span></>}>
              <input
                type="password"
                placeholder="8자 이상"
                className="w-full"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={8}
              />
            </FormField>

            <FormField label="연락처">
              <input
                type="tel"
                placeholder="010-0000-0000"
                className="w-full"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
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
