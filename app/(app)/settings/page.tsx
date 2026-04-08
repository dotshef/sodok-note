"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import Image from "next/image";

interface Tenant {
  name: string;
  business_number: string | null;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  plan: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    businessNumber: "",
    ownerName: "",
    phone: "",
    address: "",
  });

  const fetchTenant = useCallback(async () => {
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
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        fetchTenant();
        setSuccess("로고가 업로드되었습니다");
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("업로드에 실패했습니다");
    } finally {
      setUploading(false);
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">설정</h2>

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success text-sm mb-4">
          <span>{success}</span>
        </div>
      )}

      {/* 로고 업로드 */}
      <div className="card bg-base-100 border border-base-300 mb-4">
        <div className="card-body">
          <h3 className="font-semibold mb-3">업체 로고</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 border border-base-300 rounded-lg flex items-center justify-center overflow-hidden bg-base-200">
              {tenant?.logo_url ? (
                <Image
                  src={tenant.logo_url}
                  alt="업체 로고"
                  width={96}
                  height={96}
                  className="object-contain"
                />
              ) : (
                <span className="text-base-content/30 text-xs">로고 없음</span>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                className="btn btn-outline btn-sm gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <Upload size={14} /> 로고 업로드
                  </>
                )}
              </button>
              <p className="text-xs text-base-content/50 mt-1">
                증명서에 표시됩니다. PNG, JPG 권장.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 업체 정보 */}
      <form onSubmit={handleSave}>
        <div className="card bg-base-100 border border-base-300 mb-4">
          <div className="card-body space-y-4">
            <h3 className="font-semibold">업체 정보</h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">업체명</span>
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
                <span className="label-text font-medium">사업자등록번호</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.businessNumber}
                onChange={(e) => setForm((p) => ({ ...p, businessNumber: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">대표자명</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.ownerName}
                  onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">전화번호</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered w-full"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">주소</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* 플랜 정보 */}
        <div className="card bg-base-100 border border-base-300 mb-4">
          <div className="card-body">
            <h3 className="font-semibold">플랜 정보</h3>
            <p className="text-sm mt-2">
              현재 플랜:{" "}
              <span className="badge badge-primary">
                {tenant?.plan === "basic" ? "베이직" : tenant?.plan === "plus" ? "플러스" : "프로"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : "저장"}
          </button>
        </div>
      </form>

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
      <div className="card bg-base-100 border border-base-300 mb-4">
        <div className="card-body space-y-4">
          <h3 className="font-semibold">비밀번호 변경</h3>

          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success text-sm">
              <span>{success}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">현재 비밀번호</span>
            </label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">새 비밀번호</span>
            </label>
            <input
              type="password"
              placeholder="8자 이상"
              className="input input-bordered w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-outline" disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-sm" /> : "비밀번호 변경"}
        </button>
      </div>
    </form>
  );
}
