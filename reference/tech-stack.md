# 기술 스택 정의

## 코어

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.x | SSR/SSG, 라우팅, API Routes |
| 언어 | TypeScript | 5.x | 타입 안전성 |
| 런타임 | React | 19.x | UI 렌더링 |

## 스타일링

| 기술 | 용도 |
|------|------|
| Tailwind CSS 4 | 유틸리티 CSS |
| DaisyUI 5 | UI 컴포넌트 (버튼, 카드, 모달, 탭, 네비게이션 등) |
| tailwindcss-animate | 트랜지션/애니메이션 |

## 백엔드 / DB

| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL DB, Storage (Auth는 사용하지 않음 — 자체 구현) |
| @supabase/ssr | Next.js App Router용 서버/클라이언트 클라이언트 |
| @supabase/supabase-js | Supabase JavaScript SDK |

## 상태 관리 / 데이터 페칭

| 기술 | 용도 |
|------|------|
| Zustand | 클라이언트 전역 상태 (인증 유저, 알림 등) |
| SWR 또는 React Query 없이 | Supabase 클라이언트로 직접 페칭 + Server Components 활용 |

## PDF 생성

| 기술 | 용도 |
|------|------|
| @react-pdf/renderer | 소독증명서 PDF 클라이언트 사이드 생성 |

## 캘린더

| 기술 | 용도 |
|------|------|
| date-fns | 날짜 계산 (주기 계산, 하절기/동절기 판별, 포맷팅) |
| 자체 구현 | 월간/주간 캘린더 뷰 (DaisyUI 기반 직접 구현) |

## PWA

| 기술 | 용도 |
|------|------|
| @ducanh2912/next-pwa | Next.js PWA 지원 (next-pwa 후속) |

## 인증

| 기술 | 용도 |
|------|------|
| bcrypt (bcryptjs) | 비밀번호 해싱 |
| jose | JWT 생성/검증 (Edge Runtime 호환) |

## 폼 / 유효성 검사

| 기술 | 용도 |
|------|------|
| React Hook Form | 폼 상태 관리 (고객 등록, 방문 입력 등) |
| Zod | 스키마 기반 유효성 검사 |

## 아이콘

| 기술 | 용도 |
|------|------|
| Lucide React | 아이콘 세트 |

## 배포

| 기술 | 용도 |
|------|------|
| Vercel | 호스팅, CI/CD, 환경변수 관리 |

## 개발 도구

| 기술 | 용도 |
|------|------|
| ESLint 9 | 코드 린팅 |
| Prettier | 코드 포맷팅 |

---

## 설치 명령어

### 프로덕션 의존성
```bash
npm install daisyui @supabase/ssr @supabase/supabase-js zustand @react-pdf/renderer date-fns react-hook-form zod lucide-react
```

### PWA (Phase 6에서 설치)
```bash
npm install @ducanh2912/next-pwa
```

### 개발 의존성
```bash
npm install -D prettier
```

---

## 사용하지 않는 것들

| 기술 | 이유 |
|------|------|
| shadcn/ui | DaisyUI 사용으로 불필요 |
| Prisma / Drizzle | Supabase 클라이언트로 직접 쿼리 |
| NextAuth | JWT + httpOnly 쿠키 자체 구현 |
| Redux | 과도함, Zustand로 충분 |
| Axios | fetch API + Supabase 클라이언트로 충분 |
| Moment.js | date-fns가 더 가볍고 트리셰이킹 지원 |
