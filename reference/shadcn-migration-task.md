# shadcn/ui 마이그레이션 작업 정의서

## 배경

현재 프로젝트는 Tailwind CSS 4 순정을 쓰고 있지만, [app/globals.css](../app/globals.css)의 `@theme` 블록에 **DaisyUI 네이밍 컨벤션을 모방한 커스텀 토큰**을 정의해 사용 중이다 (`base-100`, `base-content`, `primary-content`, `error` 등). 실제로 DaisyUI 패키지는 설치되어 있지 않다.

이 구조의 문제:
- 프로젝트를 처음 보는 사람/AI가 "DaisyUI가 설치되어 있다"고 오해할 수 있음 (과거 CLAUDE.md도 잘못 기술됨)
- DaisyUI 흔적이 남아있어 네이밍이 어정쩡함
- shadcn/ui 컴포넌트 도입 시 토큰 이름을 매번 수동 변환해야 하는 마찰

## 목표

1. `@theme` 블록을 **shadcn/ui 표준 토큰**으로 전환
2. 기존 19개 파일 212개 사용처를 shadcn 네이밍으로 치환
3. shadcn CLI를 도입하고 첫 실사용 사례로 [app/(app)/visits/visits-list.tsx](../app/(app)/visits/visits-list.tsx)의 필터 드롭다운을 Base UI Select로 교체

## 범위

### In Scope
- [app/globals.css](../app/globals.css) `@theme` 토큰 재정의 (OKLCH 색상 값은 **그대로 유지**)
- [app/globals.css](../app/globals.css) 전역 폼 스타일링 + `.data-table` 의 CSS 변수명 업데이트
- [app/globals.css](../app/globals.css) `input:focus` 등에 하드코딩된 OKLCH 값을 `var(--color-ring)` 등으로 교체
- 19개 파일의 클래스명 치환 (치환 규칙은 [shadcn-migration-map.md](./shadcn-migration-map.md) 참조)
- **PWA theme color 통일** — [public/manifest.json](../public/manifest.json) + [app/layout.tsx](../app/layout.tsx) 의 브랜드 컬러 정합
- `npx shadcn@latest init` 실행
- `npx shadcn@latest add select` 로 Select 컴포넌트 도입
- [app/(app)/visits/visits-list.tsx](../app/(app)/visits/visits-list.tsx)의 `<select>` 4개를 Base UI Select로 교체

### Out of Scope (이번 작업 아님)
- 기능/로직 변경 — 순수 네이밍 마이그레이션
- 디자인 변경 — 색감(OKLCH 값)은 그대로
- react-hook-form 도입
- visits-list 외 다른 페이지의 드롭다운/폼 교체
- Button, Card 등 다른 shadcn 컴포넌트 일괄 도입
- 인증, DB 로직 수정
- **PDF 증명서 템플릿** ([lib/pdf/certificate-template.tsx](../lib/pdf/certificate-template.tsx)) — `@react-pdf/renderer`는 Tailwind와 별개 시스템, 의도적 흑백 톤 유지
- **다크 모드** — 단일 라이트 모드만 지원
- **`--radius` 시스템** — 현재 `rounded-lg/xl` 직접 사용 유지
- **폰트 변수** (`--font-sans` 등) — Pretendard 전역 적용 방식 유지
- **애니메이션 변수 / `tw-animate-css`** — 필요 시 해당 컴포넌트 설치 시점에 자동 도입
- **스캐폴딩 SVG** ([public/file.svg](../public/file.svg), [globe.svg](../public/globe.svg), [window.svg](../public/window.svg)) — 별도 정리 작업

> 상세한 제외 사유는 [치환맵 §6 Out of Scope](./shadcn-migration-map.md#6-out-of-scope--건드리지-않는-것) 참조.

## 단계별 진행

각 단계는 **독립 커밋**으로 분리한다. 문제 발생 시 해당 커밋만 revert.

### 1. `shadcn init`
- `npx shadcn@latest init` 실행
- 대화형 프롬프트에서 `components/ui/` 경로 확인, `@/` alias 확인
- 생성된 [components/ui/](../components/ui/)의 기본 파일과 [app/globals.css](../app/globals.css) 변경을 `git diff`로 확인
- **shadcn init 직후 정리**:
  - `.dark` variant 블록이 추가되면 삭제 (다크 모드 미지원)
  - `tw-animate-css` 등 불필요한 import가 붙으면 제거
  - `--radius` 변수는 생성되어도 무방 (미사용 예정)
  - `--font-sans` / `--font-mono` 변수도 생성되어도 무방
  - 자세한 정리 기준은 [치환맵 §6](./shadcn-migration-map.md#6-out-of-scope--건드리지-않는-것) 참조
- **이 단계는 파일 추가만 — 기존 동작에 영향 없음**

### 2. `@theme` 토큰 병합
- shadcn이 추가한 토큰 블록을 기반으로 하되, **현재 프로젝트의 OKLCH 색상 값을 수동 이식** (민트 블루 primary, 레몬 옐로우 accent, 블루 톤 base 등)
- shadcn 기본에 없는 `success`, `warning`, `info` 토큰을 `-foreground` 접미사 규칙에 맞춰 추가
- 치환이 끝날 때까지 기존 DaisyUI 토큰과 **공존** 허용 (충돌 없음, 점진적 전환)

### 3. `components/ui/` 치환
- [components/ui/form-field.tsx](../components/ui/form-field.tsx), [components/ui/spinner.tsx](../components/ui/spinner.tsx) — 파일이 작고 영향 범위 적음
- 먼저 치환해서 shadcn 토큰이 잘 적용되는지 검증

### 4. `components/layout/` 치환
- [components/layout/sidebar.tsx](../components/layout/sidebar.tsx), [components/layout/header.tsx](../components/layout/header.tsx)
- 모든 페이지에서 공유되는 UI 골격 — 여기가 잘 되면 페이지별 치환이 수월

### 5. `app/(app)/` 페이지 치환
파일별 순차 진행. 각 파일 치환 후 `npm run dev`로 시각 확인.

순서 (작은 것 → 큰 것):
1. [app/(app)/layout.tsx](../app/(app)/layout.tsx)
2. [app/(app)/members/new/page.tsx](../app/(app)/members/new/page.tsx)
3. [app/(app)/members/page.tsx](../app/(app)/members/page.tsx)
4. [app/(app)/members/[id]/edit/page.tsx](../app/(app)/members/[id]/edit/page.tsx)
5. [app/(app)/clients/page.tsx](../app/(app)/clients/page.tsx)
6. [app/(app)/clients/new/page.tsx](../app/(app)/clients/new/page.tsx)
7. [app/(app)/clients/[id]/page.tsx](../app/(app)/clients/[id]/page.tsx)
8. [app/(app)/clients/[id]/edit/page.tsx](../app/(app)/clients/[id]/edit/page.tsx)
9. [app/(app)/visits/visits-list.tsx](../app/(app)/visits/visits-list.tsx)
10. [app/(app)/visits/[id]/page.tsx](../app/(app)/visits/[id]/page.tsx)
11. [app/(app)/calendar/page.tsx](../app/(app)/calendar/page.tsx)
12. [app/(app)/dashboard/page.tsx](../app/(app)/dashboard/page.tsx)
13. [app/(app)/certificates/page.tsx](../app/(app)/certificates/page.tsx)
14. [app/(app)/settings/page.tsx](../app/(app)/settings/page.tsx)

공개 페이지:
15. [app/signup/page.tsx](../app/signup/page.tsx)
16. [app/login/page.tsx](../app/login/page.tsx)

### 6. `globals.css` 최종 정리 + PWA 색상 통일 ★

클래스 치환으로 잡히지 않는 모든 영역을 한 번에 정리한다. 자세한 before/after는 [치환맵 §4](./shadcn-migration-map.md#4-css-파일-내부-globalscss-치환-) 참조.

**6.1 globals.css 내부 CSS 규칙**
- `input:where(...)` / `select` / `textarea` 셀렉터 본문:
  - `var(--color-base-300)` → `var(--color-input)`
  - `var(--color-base-100)` → `var(--color-background)`
- `:focus` 상태 본문:
  - 하드코딩 `oklch(0.58 0.13 200 / 0.5)` → `var(--color-ring)`
  - 하드코딩 `oklch(0.58 0.13 200 / 0.15)` → `color-mix(...)` 또는 `var(--color-ring)` 단독
- `.data-table th` 본문:
  - 하드코딩 `oklch(0.24 0.04 220 / 0.6)` → `var(--color-muted-foreground)`
  - `var(--color-base-300)` → `var(--color-border)`
- `.data-table td` 본문:
  - `var(--color-base-300)` → `var(--color-border)`

**6.2 `@theme` 블록에서 구 DaisyUI 토큰 최종 삭제**
- `--color-base-*`, `--color-*-content`, `--color-error`, `--color-neutral`, `--color-neutral-content` 전부 제거
- 이 시점에 모든 클래스 사용처가 치환되어 있어야 하므로 빌드/렌더링 영향 없음
- shadcn 표준 토큰 + 프로젝트 확장(`success`, `warning`, `info`)만 남김

**6.3 PWA 색상 통일** ([치환맵 §4.4](./shadcn-migration-map.md#44-pwa-theme_color-통일-))
- 현재 [public/manifest.json](../public/manifest.json)의 `theme_color = "#570df8"` (DaisyUI 스캐폴딩 보라색, 브랜드와 무관)
- 현재 [app/layout.tsx](../app/layout.tsx)의 `viewport.themeColor = "#2b3a67"` (남색, 브랜드와 무관)
- **두 값 모두** 새 `--color-primary` (민트 블루 `oklch(0.58 0.13 200)`)의 hex 변환값으로 통일
- 변환 방법: 브라우저 DevTools의 computed style 또는 oklch→hex 변환기 사용
- 대략적인 hex: `#3ba8c7` 근처 (변환 시점에 정확한 값 확정)

**검증**: [치환맵 §9.2](./shadcn-migration-map.md#92-css-파일-내부-검증-globalscss-단독), [§9.3](./shadcn-migration-map.md#93-pwa-색상-일치-검증) 참조

### 7. Select 컴포넌트 설치
- `npx shadcn@latest add select`
- 설치 직후 생성된 [components/ui/select.tsx](../components/ui/select.tsx) 확인 — shadcn 토큰이 바로 통해야 함 (2단계에서 토큰을 심어놨으므로)

### 8. `visits-list.tsx` 드롭다운 교체
- [app/(app)/visits/visits-list.tsx:170-238](../app/(app)/visits/visits-list.tsx#L170-L238)의 4개 `<select>` 엘리먼트를 Base UI Select 기반으로 교체
  - 상태 필터 (전체/예정/완료/미완료)
  - 시설 유형 필터
  - 담당자 필터 (admin만)
- 기능 완전 동일, 외형만 개선

## 성공 기준

- [ ] `npm run build` 성공
- [ ] `npm run dev`에서 모든 페이지 시각적 회귀 없음
- [ ] **클래스명 잔재 검증** — `.md`, `.css` 제외 후 0건:
  ```
  패턴: base-100|base-200|base-300|base-content|primary-content|secondary-content|accent-content|neutral-content|text-error|bg-error|border-error
  ```
- [ ] **`globals.css` 내부 검증** — 구 토큰 변수·하드코딩 OKLCH 0건 ([§9.2](./shadcn-migration-map.md#92-css-파일-내부-검증-globalscss-단독))
- [ ] **PWA 색상 일치** — [manifest.json](../public/manifest.json)과 [app/layout.tsx](../app/layout.tsx)의 theme color가 동일한 hex 문자열 ([§9.3](./shadcn-migration-map.md#93-pwa-색상-일치-검증))
- [ ] **`text-base` (폰트 크기) 잔존 확인** — 치환 후에도 기존 `text-base` 사용처가 그대로 남아있어야 정상 (오치환 없음 검증)
- [ ] [visits-list.tsx](../app/(app)/visits/visits-list.tsx) 드롭다운이 Base UI Select로 동작, 키보드 네비게이션·포지셔닝 개선 확인
- [ ] [CLAUDE.md](../CLAUDE.md)의 스타일링 규칙 섹션 업데이트 (DaisyUI 네이밍 설명 → shadcn 네이밍 설명으로)

## 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 클래스 오타 → TS가 못 잡음 | 파일별 커밋 + `npm run dev` 시각 확인 + 최종 Grep |
| **`text-base` (폰트 크기) 오치환** ⚠️ | 반드시 `text-base-content` 전체 단위로만 매치. `text-base` 단독은 **절대 건드리지 말 것**. [치환맵 §5](./shadcn-migration-map.md#5-false-positive-주의-) 참조 |
| `bg-base-100` 컨텍스트 혼동 (카드 vs 페이지) | [치환맵 §3](./shadcn-migration-map.md#3-컨텍스트-판단-규칙) 컨텍스트 규칙 준수 |
| shadcn init이 기존 `@theme` 덮어쓰기 | 2단계에서 **수동 병합**. init 직후 git diff로 확인 |
| 새 토큰(`success` 등) 누락 | 2단계에서 명시적으로 추가, 치환맵 [§0](./shadcn-migration-map.md#0-신규-theme-토큰) 기재 |
| 작업 중단 후 재개 시 맥락 손실 | 이 문서 + [치환맵](./shadcn-migration-map.md)이 단일 근거 |
| OKLCH 색상 이식 실수 | 2단계에서 기존 globals.css와 side-by-side 비교 |
| **CSS 파일 내부 (globals.css) 누락** | Grep이 `.css`를 제외하므로 검증 불가. 6단계에서 **수동으로 체크리스트 진행**. [치환맵 §4](./shadcn-migration-map.md#4-css-파일-내부-globalscss-치환-) 참조 |
| **PWA 색상 불일치** | manifest.json + layout.tsx 두 곳을 동시에 수정. [§9.3 검증](./shadcn-migration-map.md#93-pwa-색상-일치-검증) |
| **다크 모드 토큰이 init에 섞여 들어옴** | 1단계 init 직후 `.dark` 블록 삭제 |

## 롤백 플랜

- 1~2단계: 파일 추가 + 토큰 추가만 — 기존 코드에 영향 없음, 롤백 불필요
- 3~6단계: 각 파일 커밋이 독립적 — 문제 파일 커밋만 `git revert`
- 7단계: 컴포넌트 파일 삭제로 복구 가능
- 8단계: 기존 `<select>` 마크업 보존용으로 브랜치에 백업 태그 남기고 진행

## 참고

- [치환맵](./shadcn-migration-map.md) — 작업 중 수시로 참조/업데이트
- [shadcn/ui 공식 문서](https://ui.shadcn.com/docs)
- [Base UI Select 문서](https://www.radix-ui.com/primitives/docs/components/select)
- 작업 완료 후 이 문서와 치환맵은 `reference/archive/` 또는 `done-` 접두사로 보존
