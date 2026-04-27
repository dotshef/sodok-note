"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { FilterSelect } from "@/components/ui/filter-select";
import { Spinner } from "@/components/ui/spinner";

const categories = [
  { value: "bug", label: "버그 신고" },
  { value: "feature", label: "기능 제안" },
  { value: "question", label: "사용 문의" },
  { value: "etc", label: "기타" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    category: "bug",
    title: "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "문의 전송에 실패했습니다");
        return;
      }

      setSuccess("문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.");
      setForm({ category: "bug", title: "", content: "" });
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-base text-muted-foreground mb-4">
        서비스 사용 중 불편한 점이나 개선 의견을 자유롭게 남겨주세요.
      </p>

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

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6 space-y-4">
            <FormField label="유형">
              <FilterSelect
                value={form.category}
                onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                options={categories}
              />
            </FormField>

            <FormField label="제목">
              <input
                type="text"
                className="w-full"
                placeholder="문의 내용을 한 줄로 요약해주세요"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                maxLength={100}
              />
            </FormField>

            <FormField label="내용">
              <textarea
                className="w-full min-h-[200px]"
                placeholder="자세한 내용을 작성해주세요. 발생 상황, 사용 환경 등을 함께 알려주시면 더 빠르게 도움드릴 수 있습니다."
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                required
                maxLength={2000}
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" /> : "문의 보내기"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
