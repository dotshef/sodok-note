---
description: Next.js 16 관련 규칙. 라우팅, 미들웨어, 빌드 관련 작업 시 적용.
globs: ["**/*.ts", "**/*.tsx", "proxy.ts"]
---

# Next.js 16 규칙

## proxy (구 middleware)
- Next.js 16에서 `middleware.ts`는 deprecated됨
- 반드시 `proxy.ts` 파일명 + `export function proxy()` 함수명 사용
- 기존 middleware와 동일한 API (NextRequest, NextResponse, cookies, redirect 등)
- 절대 `middleware.ts` 파일을 생성하지 말 것

## 링크 태그 사용 규칙
- **내부 네비게이션**: `<Link>` 사용 (프리페치 + 클라이언트 라우팅)
- **외부 사이트 이동**: `<a>` 사용
- **파일 다운로드**: `<a download>` 사용 — 새 창 없이 바로 다운로드
- `<Link>`(a 태그) 내부에 `<a>` 태그를 중첩하지 말 것 (hydration 에러 발생)
- `<Link>`와 다운로드 버튼이 같은 카드에 있을 경우, DOM 구조를 분리할 것 (상단 Link + 하단 다운로드)

## metadata / viewport 분리
- `themeColor`, `width`, `initialScale` 등 viewport 관련 속성은 `metadata`에 넣지 말 것
- 별도로 `export const viewport: Viewport = { ... }` 사용
- `import type { Metadata, Viewport } from "next"` 로 타입 임포트