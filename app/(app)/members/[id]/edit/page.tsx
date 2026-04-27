"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { FilterSelect } from "@/components/ui/filter-select";
import { Spinner } from "@/components/ui/spinner";
import { HelpPopover } from "@/components/ui/help-popover";
import { useSession } from "@/components/providers/session-provider";

const ROLE_OPTIONS = [
  { value: "member", label: "직원" },
  { value: "admin", label: "관리자" },
];

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const router = useRouter();
  const isSelf = session.userId === id;
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", passwordConfirm: "", role: "member" as "admin" | "member" });

  useEffect(() => {
    let ignore = false;

    async function fetchMember() {
      try {
        const res = await fetch(`/api/members/${id}`);
        if (!res.ok) {
          if (!ignore) {
            setError(`불러오기 실패 (status ${res.status})`);
            setLoaded(true);
          }
          return;
        }
        const member = await res.json();
        if (!ignore) {
          setForm({ name: member.name, phone: member.phone || "", email: member.email || "", password: "", passwordConfirm: "", role: member.role || "member" });
          setLoaded(true);
        }
      } catch (e) {
        if (!ignore) {
          setError(`네트워크/파싱 에러: ${e instanceof Error ? e.message : String(e)}`);
          setLoaded(true);
        }
      }
    }

    fetchMember();

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (changePassword) {
      if (!form.password || !form.passwordConfirm) {
        setError("비밀번호를 입력해주세요");
        return;
      }
      if (form.password !== form.passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다");
        return;
      }
    }

    setSaving(true);

    try {
      const payload: Record<string, string> = { name: form.name, phone: form.phone, email: form.email };
      if (!isSelf) payload.role = form.role;
      if (changePassword && form.password) payload.password = form.password;

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
        <div className="flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl bg-card border border-border">
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

            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      setForm((p) => ({ ...p, password: "", passwordConfirm: "" }));
                    }
                  }}
                />
                <span className="text-base font-medium">비밀번호 변경</span>
              </label>
            </div>

            {changePassword && (
              <>
                <FormField label="새 비밀번호">
                  <input
                    type="password"
                    placeholder="8자 이상 입력"
                    className="w-full"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    minLength={8}
                    required
                  />
                </FormField>

                <FormField label="새 비밀번호 확인">
                  <input
                    type="password"
                    placeholder="비밀번호를 다시 입력"
                    className="w-full"
                    value={form.passwordConfirm}
                    onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
                    minLength={8}
                    required
                  />
                  {form.passwordConfirm && form.password !== form.passwordConfirm && (
                    <p className="text-sm text-destructive mt-1">비밀번호가 일치하지 않습니다</p>
                  )}
                </FormField>
              </>
            )}

            <FormField label={<>역할{" "}<HelpPopover><p><strong>관리자</strong>: 고객 관리, 직원 관리에 접근할 수 있고, 모든 방문 데이터를 볼 수 있습니다.</p><p><strong>멤버</strong>: 고객 관리, 직원 관리에 접근할 수 없습니다. 자신에게 속한 방문 데이터만 볼 수 있습니다.</p></HelpPopover></>}>
              <FilterSelect
                value={form.role}
                onChange={(v) => setForm((p) => ({ ...p, role: v as "admin" | "member" }))}
                options={ROLE_OPTIONS}
                disabled={isSelf}
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
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer" onClick={() => router.back()}>
            취소
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer" disabled={saving}>
            {saving ? <Spinner size="sm" /> : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
