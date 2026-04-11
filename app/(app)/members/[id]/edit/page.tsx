"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  useEffect(() => {
    let ignore = false;

    async function fetchMember() {
      const res = await fetch("/api/members");
      const data = await res.json();
      const member = data.members?.find((m: { id: string }) => m.id === id);
      if (!member) {
        router.push("/members");
        return;
      }
      if (!ignore) {
        setForm({ name: member.name, phone: member.phone || "", email: member.email || "", password: "" });
        setLoaded(true);
      }
    }

    fetchMember();

    return () => {
      ignore = true;
    };
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload: Record<string, string> = { name: form.name, phone: form.phone, email: form.email };
      if (form.password) payload.password = form.password;

      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">직원 정보 수정</h2>

      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-error/10 text-error border border-error/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl bg-base-100 border border-base-300">
          <div className="p-6 space-y-4">
            <FormField label="이름">
              <input
                type="text"
                className="w-full"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="이메일">
              <input
                type="email"
                className="w-full"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="비밀번호">
              <input
                type="password"
                placeholder="변경 시에만 입력"
                className="w-full"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                minLength={8}
              />
            </FormField>

            <FormField label="연락처">
              <input
                type="tel"
                className="w-full"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-base-200 transition-colors cursor-pointer" onClick={() => router.back()}>
            취소
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-content transition-colors disabled:opacity-50 cursor-pointer" disabled={saving}>
            {saving ? <Spinner size="sm" /> : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
