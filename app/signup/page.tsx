"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    businessNumber: "",
    ownerName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      {/* 회원가입 폼 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="rounded-xl w-full max-w-md bg-card shadow-xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold">회원가입</h2>
            <p className="text-muted-foreground mb-4">
              업체 정보와 관리자 계정을 등록해주세요
            </p>

            {error && (
              <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 업체 정보 */}
              <div className="flex items-center gap-3 text-base text-muted-foreground my-2">
                <span className="flex-1 border-t border-border" />
                업체 정보
                <span className="flex-1 border-t border-border" />
              </div>

              <FormField label={<>업체명 <span className="text-destructive">*</span></>}>
                <input
                  type="text"
                  placeholder="예: 그린방역"
                  className="w-full"
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="사업자등록번호">
                <input
                  type="text"
                  placeholder="000-00-00000"
                  className="w-full"
                  value={form.businessNumber}
                  onChange={(e) =>
                    updateField("businessNumber", e.target.value)
                  }
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="대표자명">
                  <input
                    type="text"
                    className="w-full"
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                  />
                </FormField>
                <FormField label="전화번호">
                  <input
                    type="tel"
                    placeholder="02-0000-0000"
                    className="w-full"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </FormField>
              </div>

              {/* 관리자 계정 */}
              <div className="flex items-center gap-3 text-base text-muted-foreground my-2">
                <span className="flex-1 border-t border-border" />
                관리자 계정
                <span className="flex-1 border-t border-border" />
              </div>

              <FormField label={<>이름 <span className="text-destructive">*</span></>}>
                <input
                  type="text"
                  placeholder="관리자 이름"
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

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 mt-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "회원가입"}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-base text-muted-foreground">
                이미 계정이 있으신가요?{" "}
              </span>
              <Link
                href="/login"
                className="text-base text-primary font-medium hover:underline"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
