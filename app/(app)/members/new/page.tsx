"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <h2 className="text-2xl font-bold mb-6">기사 등록</h2>

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
                <span className="label-text font-medium">
                  이름 <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  이메일 <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                className="input input-bordered w-full"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  비밀번호 <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="password"
                placeholder="8자 이상"
                className="input input-bordered w-full"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">연락처</span>
              </label>
              <input
                type="tel"
                placeholder="010-0000-0000"
                className="input input-bordered w-full"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.back()}
          >
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "등록"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
