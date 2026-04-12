"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

interface Tenant {
  name: string;
  business_number: string | null;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  plan: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    businessNumber: "",
    ownerName: "",
    phone: "",
    address: "",
  });

  const loading = !tenant;

  async function fetchTenant() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setTenant(data);
    setForm({
      name: data.name || "",
      businessNumber: data.business_number || "",
      ownerName: data.owner_name || "",
      phone: data.phone || "",
      address: data.address || "",
    });
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!ignore) {
        setTenant(data);
        setForm({
          name: data.name || "",
          businessNumber: data.business_number || "",
          ownerName: data.owner_name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setSuccess("저장되었습니다");
      fetchTenant();
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

      {/* 업체 정보 */}
      <form onSubmit={handleSave}>
        <div className="rounded-xl bg-card border border-border mb-4">
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold">업체 정보</h3>

            <FormField label="업체명">
              <input
                type="text"
                className="w-full"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="사업자등록번호">
              <input
                type="text"
                className="w-full"
                value={form.businessNumber}
                onChange={(e) => setForm((p) => ({ ...p, businessNumber: e.target.value }))}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="대표자명">
                <input
                  type="text"
                  className="w-full"
                  value={form.ownerName}
                  onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
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

            <FormField label="주소">
              <input
                type="text"
                className="w-full"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
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
