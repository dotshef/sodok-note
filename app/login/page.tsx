"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, FileText, ClipboardList } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <div className="flex min-h-screen">
      {/* 좌측 — 브랜드 소개 */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center px-16 text-primary-foreground">
        <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold mb-4">방역매니저</h1>
        <p className="text-lg opacity-90 mb-10">소독/방역업체를 위한 올인원 관리 플랫폼</p>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
            <span className="text-base opacity-80">스케줄 자동 관리</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="text-base opacity-80">증명서 원클릭 발급</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <span className="text-base opacity-80">고객 이력 한눈에</span>
          </div>
        </div>
        </div>
      </div>

      {/* 우측 — 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <div className="rounded-xl bg-card w-full max-w-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="text-muted-foreground mb-6">
              방역매니저에 오신 것을 환영합니다
            </p>

            {error && (
              <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="이메일">
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="비밀번호">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormField>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-base text-primary hover:underline"
                >
                  비밀번호 찾기
                </Link>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "로그인"}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-base text-muted-foreground">
                계정이 없으신가요?{" "}
              </span>
              <Link
                href="/signup"
                className="text-base text-primary font-medium hover:underline"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
