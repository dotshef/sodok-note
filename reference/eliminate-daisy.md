# DaisyUI 제거 시 파생효과 분석

## 현재 DaisyUI 설정

- `package.json`: `"daisyui": "^5.5.19"`
- `app/globals.css`: `@plugin "daisyui" { themes: light --default; }`
- `data-theme` 속성은 미사용

---

## 1. 색상 시스템 (`@theme` 블록)

`globals.css`의 `@theme {}` 블록은 DaisyUI 컨벤션의 색상명(`primary`, `base-100` 등)을 사용하지만,
**Tailwind v4의 네이티브 `@theme` 문법**이므로 DaisyUI 제거 후에도 그대로 동작한다.

| 색상 변수 | 사용 형태 | 대략적 사용 횟수 |
|---|---|---|
| `primary` | `bg-primary`, `text-primary`, `border-primary`, `bg-primary/10` | ~35 |
| `base-100/200/300` | `bg-base-100`, `bg-base-200`, `border-base-300` | ~75 |
| `base-content` | `text-base-content`, `text-base-content/50~70` | ~35 |
| `success` | `bg-success/10`, `text-success`, `border-success/30` | ~15 |
| `error` | `bg-error`, `text-error` | ~15 |
| `info` | `bg-info/10`, `text-info` | ~3 |

**파생효과: 없음** — `@theme` 블록을 유지하면 모든 색상 유틸리티가 계속 작동한다.

---

## 2. 컴포넌트별 영향

### btn (~55회, 14개 파일)

| 클래스 | 횟수 |
|---|---|
| `btn` | ~36 |
| `btn-md` | ~22 |
| `btn-ghost` | ~16 |
| `btn-primary` | ~12 |
| `btn-outline` | ~5 |
| `btn-square` | ~4 |
| `btn-error`, `btn-disabled` | 각 ~1 |

**대체**: `<Button>` 공통 컴포넌트 생성 또는 Tailwind 유틸리티 직접 적용
(`px-4 py-2 rounded-lg font-medium transition-colors` + variant별 색상)

**영향 파일**: visits/[id], clients/page, clients/[id], settings, members/page, members/new, members/[id]/edit, clients/new, clients/[id]/edit, calendar, header, signup, login, certificates

---

### input / select / textarea (~50회, 9개 파일)

| 클래스 | 횟수 |
|---|---|
| `input input-bordered` | ~38 |
| `select select-bordered` | ~3 |
| `textarea textarea-bordered` | ~3 |

**대체**: `border border-base-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30`

**영향 파일**: signup(7), settings(7), clients/new(7), clients/[id]/edit(6), members/new(4), login(2), visits/[id](2), members/[id]/edit(2), clients/page(1)

---

### card (~70회, 12개 파일)

| 클래스 | 횟수 |
|---|---|
| `card` | ~30 |
| `card-body` | ~30 |
| `card-title` | ~9 |

**대체**: `rounded-xl border border-base-300 bg-base-100 shadow-sm` + `p-6` (card-body) + `text-lg font-semibold` (card-title)

**영향 파일**: dashboard(17), clients/[id](14), visits/[id](10), settings(6), clients/new(6), clients/[id]/edit(4), signup(3), login(3), members/new(2), members/[id]/edit(2), calendar(2)

---

### badge (~20회, 6개 파일)

동적 클래스 사용 있음 (조건부 `badge-primary`, `badge-success`, `badge-error` 등)

**대체**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium` + variant별 배경/텍스트 색상

**영향 파일**: visits/[id], clients/[id], members/page, dashboard, header, calendar

---

### loading / spinner (~63회, 14개 파일)

| 클래스 | 횟수 |
|---|---|
| `loading loading-spinner` | ~21 |
| `loading-sm/md/lg` | ~21 |

**대체**: SVG 스피너 컴포넌트 생성 필요. 거의 모든 페이지에서 사용 중.

**영향 파일**: 전체 페이지 (14개 파일)

---

### alert (~18회, 8개 파일)

| 클래스 | 횟수 |
|---|---|
| `alert alert-error` | ~9 |
| `alert alert-success` | ~2 |

**대체**: `flex gap-3 rounded-lg p-4 border` + error/success별 색상

**영향 파일**: settings(4), clients/new, clients/[id]/edit, members/new, members/[id]/edit, visits/[id], login, signup

---

### table (~10회, 5개 파일)

`table table-md` — 패딩, 정렬, 보더 제공

**대체**: `w-full text-sm` + `th`/`td`에 패딩/보더 직접 적용

**영향 파일**: certificates, clients/page, clients/[id], dashboard, members/page

---

### form-control / label / label-text (components/ui/form-field.tsx)

`FormField` 컴포넌트에서 사용. **84개 렌더 사이트**에 간접 영향.

**대체**: `form-control` → `flex flex-col gap-1`, `label-text` → `text-sm font-medium`

**이 파일만 수정하면 84개 폼 필드가 일괄 전환됨** — 가장 효율적인 마이그레이션 포인트.

---

### 기타 소량 사용

| 컴포넌트 | 횟수 | 파일 | 대체 |
|---|---|---|---|
| `join / join-item` | ~6 | clients/page | `flex` + 라운딩 수동 제어 |
| `dropdown / menu` | ~5 | header.tsx | `relative/absolute` 포지셔닝 |
| `divider` | 2 | signup | `border-t` 또는 flex 패턴 |
| `checkbox checkbox-sm` | 2 | login | 기본 checkbox + accent-color |

---

## 3. 마이그레이션 우선순위

### Phase 1: 인프라 (1개 파일 수정 → 84개 폼 일괄 전환)
- `components/ui/form-field.tsx` — form-control, label, label-text 대체

### Phase 2: 공통 컴포넌트 생성 (3개 파일 생성)
- `components/ui/button.tsx` — btn 대체 (14개 파일 영향)
- `components/ui/spinner.tsx` — loading 대체 (14개 파일 영향)
- `components/ui/alert.tsx` — alert 대체 (8개 파일 영향)

### Phase 3: 인라인 대체 (직접 클래스 교체)
- `card` → Tailwind 유틸리티 (12개 파일)
- `input/select/textarea` → Tailwind 유틸리티 (9개 파일)
- `badge` → Tailwind 유틸리티 (6개 파일)
- `table` → Tailwind 유틸리티 (5개 파일)

### Phase 4: 소량 정리
- join, dropdown, divider, checkbox (각 1~2개 파일)

### Phase 5: 제거
- `package.json`에서 `daisyui` 삭제
- `globals.css`에서 `@plugin "daisyui"` 삭제
- `@theme` 블록은 유지

---

## 4. 리스크

| 리스크 | 설명 |
|---|---|
| **focus 스타일 소실** | DaisyUI가 input/select/btn에 제공하던 focus ring이 사라짐. 직접 정의 필요 |
| **반응형 사이징** | `btn-md`, `input-md` 등 DaisyUI 사이즈 프리셋이 사라짐. 패딩/폰트 직접 지정 |
| **다크모드** | 현재 미사용이지만, 향후 필요 시 DaisyUI 테마 시스템 없이 직접 구현해야 함 |
| **CSS 리셋 변경** | DaisyUI가 적용하던 기본 리셋(버튼 appearance 등)이 사라질 수 있음 |
| **작업량** | 약 16개 파일, ~300개 클래스 토큰 교체 필요 |
