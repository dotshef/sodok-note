"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

type VerifyState = "idle" | "code-sent" | "verified";

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
    passwordConfirm: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEmail(value: string) {
    updateField("email", value);
    if (verifyState !== "idle") {
      setVerifyState("idle");
      setCode("");
      setVerifyError("");
    }
  }

  async function handleSendCode() {
    if (!form.email) {
      setVerifyError("이메일을 입력해주세요");
      return;
    }
    setVerifyError("");
    setSending(true);

    try {
      const res = await fetch("/api/auth/signup/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error);
        return;
      }
      setVerifyState("code-sent");
      setCode("");
    } catch {
      setVerifyError("인증번호 발송에 실패했습니다");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyCode() {
    if (!/^\d{6}$/.test(code)) {
      setVerifyError("인증번호 6자리를 입력해주세요");
      return;
    }
    setVerifyError("");
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/signup/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error);
        return;
      }
      setVerifyState("verified");
      setCode("");
    } catch {
      setVerifyError("인증에 실패했습니다");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (verifyState !== "verified") {
      setError("이메일 인증을 완료해주세요");
      return;
    }

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
        <div className="rounded-xl w-full max-w-md bg-card">
          <div className="p-6">
            <h2 className="text-2xl font-bold">회원가입</h2>
            <p className="text-muted-foreground mb-4">
              업체 정보와 관리자 정보를 입력해주세요
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
                  placeholder=""
                  className="w-full"
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  required
                />
              </FormField>

              <FormField label={<>사업자등록번호 <span className="text-destructive">*</span></>}>
                <input
                  type="text"
                  placeholder="000-00-00000"
                  className="w-full"
                  value={form.businessNumber}
                  onChange={(e) =>
                    updateField("businessNumber", e.target.value)
                  }
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={<>대표자명 <span className="text-destructive">*</span></>}>
                  <input
                    type="text"
                    className="w-full"
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    required
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
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="flex-1"
                    value={form.email}
                    onChange={(e) => updateEmail(e.target.value)}
                    required
                    disabled={verifyState === "verified"}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sending || verifyState === "verified" || !form.email}
                    className={`shrink-0 px-3 rounded-lg text-base font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                      verifyState === "verified"
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {verifyState === "verified" ? (
                      "인증됨"
                    ) : sending ? (
                      <Spinner size="sm" />
                    ) : verifyState === "code-sent" ? (
                      "재발송"
                    ) : (
                      "인증하기"
                    )}
                  </button>
                </div>
                {verifyError && (
                  <p className="text-base text-destructive mt-1">{verifyError}</p>
                )}
              </FormField>

              {verifyState === "code-sent" && (
                <FormField label="인증번호">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="6자리"
                      maxLength={6}
                      className="flex-1"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/[^\d]/g, ""))
                      }
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifying || code.length !== 6}
                      className="shrink-0 px-3 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {verifying ? <Spinner size="sm" /> : "확인"}
                    </button>
                  </div>
                  <p className="text-base text-muted-foreground mt-1">
                    인증번호를 입력하신 이메일로 발송했습니다
                  </p>
                </FormField>
              )}

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

              <FormField label={<>비밀번호 확인 <span className="text-destructive">*</span></>}>
                <input
                  type="password"
                  placeholder="비밀번호를 다시 입력"
                  className="w-full"
                  value={form.passwordConfirm}
                  onChange={(e) => updateField("passwordConfirm", e.target.value)}
                  required
                  minLength={8}
                />
                {form.passwordConfirm && form.password !== form.passwordConfirm && (
                  <p className="text-base text-destructive mt-1">비밀번호가 일치하지 않습니다</p>
                )}
              </FormField>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 mt-2 cursor-pointer"
                disabled={loading || verifyState !== "verified"}
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
