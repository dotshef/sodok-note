import Link from "next/link";
import { Share, Plus, AlertTriangle } from "lucide-react";

export default function InstallPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">소독노트 앱 설치</h1>
        <p className="text-base text-muted-foreground mb-8">
          iPhone에서 홈 화면에 추가하면 앱처럼 사용할 수 있어요.
        </p>

        <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 mb-8 flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-semibold text-warning">
              반드시 Safari로 열어주세요
            </p>
            <p className="text-base text-muted-foreground mt-1">
              크롬, 네이버 앱, 카카오톡 인앱 브라우저에서는 설치할 수 없습니다.
            </p>
          </div>
        </div>

        <ol className="space-y-6">
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold mb-1">공유 버튼을 누르세요</p>
              <p className="text-base text-muted-foreground mb-3">
                Safari 하단(또는 상단)에 있는 <Share size={16} className="inline align-text-bottom" /> 공유 버튼을 눌러주세요.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold mb-1">
                &quot;홈 화면에 추가&quot; 선택
              </p>
              <p className="text-base text-muted-foreground mb-3">
                메뉴를 아래로 스크롤해서 <Plus size={16} className="inline align-text-bottom" /> <strong>홈 화면에 추가</strong> 항목을 찾아 선택하세요.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold mb-1">
                오른쪽 상단 &quot;추가&quot; 누르기
              </p>
              <p className="text-base text-muted-foreground">
                화면 오른쪽 상단의 <strong>추가</strong> 버튼을 누르면 홈 화면에 소독노트 아이콘이 생깁니다.
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-10 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground cursor-pointer"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
