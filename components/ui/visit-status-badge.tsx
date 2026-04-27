// 방문 상태(scheduled/completed/missed) 표시용 유틸 + 배지 컴포넌트
// 신규 status 추가 시 이 파일만 수정.

export function getVisitStatusLabel(status: string): string {
  switch (status) {
    case "completed": return "완료";
    case "missed": return "미완료";
    default: return "예정";
  }
}

// soft variant (기본): 10% 배경 + 색상 텍스트
function softColorClass(status: string): string {
  switch (status) {
    case "completed": return "bg-success/10 text-success";
    case "missed": return "bg-destructive/10 text-destructive";
    default: return "bg-primary/10 text-primary";
  }
}

// solid variant: 풀 배경 + 흰 텍스트 (캘린더용)
export function getVisitStatusSolidBgClass(status: string): string {
  switch (status) {
    case "completed": return "bg-success";
    case "missed": return "bg-destructive";
    default: return "bg-primary";
  }
}

interface VisitStatusBadgeProps {
  status: string;
  variant?: "soft" | "solid";
  className?: string;
}

export function VisitStatusBadge({ status, variant = "soft", className = "" }: VisitStatusBadgeProps) {
  const colorClass =
    variant === "solid"
      ? `${getVisitStatusSolidBgClass(status)} text-white`
      : softColorClass(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium ${colorClass} ${className}`}
    >
      {getVisitStatusLabel(status)}
    </span>
  );
}
