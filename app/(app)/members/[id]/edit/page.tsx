"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "" });

  const fetchMember = useCallback(async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    const member = data.members?.find((m: { id: string }) => m.id === id);
    if (!member) {
      router.push("/members");
      return;
    }
    setForm({ name: member.name, phone: member.phone || "" });
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
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
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">기사 정보 수정</h2>

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">이름</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">연락처</span>
              </label>
              <input
                type="tel"
                className="input input-bordered w-full"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
