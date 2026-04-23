"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

type Step = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setCode("");
      setStep(2);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setResetToken(data.resetToken);
      setStep(3);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password, passwordConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push("/login");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setCode("");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 text-primary">소독노트</h1>
          <p className="text-lg text-primary/80">소독/방역업체를 위한 올인원 관리 플랫폼</p>
        </div>
        <div className="rounded-xl w-full max-w-md bg-card">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">비밀번호 찾기</h2>
              <p className="text-base text-muted-foreground">
                {step === 1 && "가입하신 이메일로 인증번호를 보내드립니다"}
                {step === 2 && `${email}로 인증번호를 보냈습니다`}
                {step === 3 && "새로운 비밀번호를 입력해주세요"}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <FormField label="이메일">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </FormField>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : "인증번호 발송"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <FormField label="인증번호">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="6자리 숫자"
                    className="w-full tracking-widest"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                </FormField>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? <Spinner size="sm" /> : "인증하기"}
                </button>

                <div className="flex items-center justify-between text-base">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    이메일 다시 입력
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-primary font-medium hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    인증번호 재발송
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <FormField label="새 비밀번호">
                  <input
                    type="password"
                    placeholder="8자 이상"
                    className="w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={8}
                  />
                </FormField>

                <FormField label="비밀번호 확인">
                  <input
                    type="password"
                    placeholder="비밀번호 재입력"
                    className="w-full"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                </FormField>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : "변경하기"}
                </button>
              </form>
            )}

            <div className="text-center mt-8">
              <Link
                href="/login"
                className="text-base text-muted-foreground hover:text-foreground"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

