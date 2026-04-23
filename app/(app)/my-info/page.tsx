"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { PushSettings } from "@/components/push/push-settings";

interface MyInfo {
  name: string;
  phone: string | null;
  email: string;
}

export default function MyInfoPage() {
  const [data, setData] = useState<MyInfo | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loading = !data;

  useEffect(() => {
    let ignore = false;

    async function load() {
      const res = await fetch("/api/my-info");
      const json = await res.json();
      if (!ignore) {
        setData(json);
        setForm({ name: json.name || "", phone: json.phone || "" });
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/my-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error);
        return;
      }

      setSuccess("저장되었습니다");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg p-4 bg-success/10 text-success border border-success/20 text-base mb-4">
          <span>{success}</span>
        </div>
      )}

      {/* 내 정보 */}
      <form onSubmit={handleSave}>
        <div className="rounded-xl bg-card border border-border mb-4">
          <div className="p-6 space-y-4">
            <FormField label="이메일">
              <input
                type="email"
                className="w-full"
                value={data.email}
                disabled
              />
            </FormField>

            <FormField label="이름">
              <input
                type="text"
                className="w-full"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="전화번호">
              <input
                type="tel"
                className="w-full"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
            disabled={saving}
          >
            {saving ? <Spinner size="sm" /> : "저장"}
          </button>
        </div>
      </form>

      {/* 푸시 알림 설정 */}
      <PushSettings />

      {/* 비밀번호 변경 */}
      <PasswordChangeSection />
    </div>
  );
}

function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess("비밀번호가 변경되었습니다");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="mt-4">
      <div className="rounded-xl bg-card border border-border mb-4">
        <div className="p-6 space-y-4">
          <h3 className="text-base font-semibold">비밀번호 변경</h3>

          {error && (
            <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base">
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 rounded-lg p-4 bg-success/10 text-success border border-success/20 text-base">
              <span>{success}</span>
            </div>
          )}

          <FormField label="현재 비밀번호">
            <input
              type="password"
              className="w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </FormField>

          <FormField label="새 비밀번호">
            <input
              type="password"
              placeholder="8자 이상"
              className="w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          disabled={saving}
        >
          {saving ? <Spinner size="sm" /> : "비밀번호 변경"}
        </button>
      </div>
    </form>
  );
}
