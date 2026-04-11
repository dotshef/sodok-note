# DaisyUI → shadcn 치환맵

> 이 문서는 [shadcn-migration-task.md](./shadcn-migration-task.md) 작업의 **살아있는 참조 테이블**이다.
> 작업 중 새 패턴을 발견하면 즉시 여기에 추가한 뒤 진행할 것.

## 0. 신규 `@theme` 토큰

shadcn 기본 토큰 + 프로젝트 확장. 색상 값은 현재 [app/globals.css](../app/globals.css)에 정의된 OKLCH 값을 그대로 이식.

### shadcn 기본 토큰 (init 시 자동 생성)
- `--color-background` / `--color-foreground`
- `--color-card` / `--color-card-foreground`
- `--color-popover` / `--color-popover-foreground`
- `--color-primary` / `--color-primary-foreground`
- `--color-secondary` / `--color-secondary-foreground`
- `--color-muted` / `--color-muted-foreground`
- `--color-accent` / `--color-accent-foreground`
- `--color-destructive` / `--color-destructive-foreground`
- `--color-border`
- `--color-input`
- `--color-ring`

### 프로젝트 확장 (수동 추가)
shadcn 기본엔 없지만 현재 프로젝트가 사용 중인 시맨틱 색상. `-foreground` 네이밍 규칙을 맞춘다.

- `--color-success` / `--color-success-foreground`
- `--color-warning` / `--color-warning-foreground`
- `--color-info` / `--color-info-foreground`

### OKLCH 이식 대응표

| 기존 토큰 | 기존 OKLCH 값 | 이식 대상 |
|---|---|---|
| `--color-primary` | `oklch(0.58 0.13 200)` | `--color-primary` |
| `--color-primary-content` | `oklch(0.99 0.005 200)` | `--color-primary-foreground` |
| `--color-secondary` | `oklch(0.60 0.14 230)` | `--color-secondary` |
| `--color-secondary-content` | `oklch(0.99 0.005 230)` | `--color-secondary-foreground` |
| `--color-accent` | `oklch(0.72 0.17 85)` | `--color-accent` |
| `--color-accent-content` | `oklch(0.22 0.03 85)` | `--color-accent-foreground` |
| `--color-neutral` | `oklch(0.28 0.03 210)` | (shadcn엔 없음, `secondary` 또는 `muted`로 재매핑 고려) |
| `--color-neutral-content` | `oklch(0.96 0.005 210)` | — |
| `--color-base-100` | `oklch(0.99 0.003 210)` | `--color-background`, `--color-card`, `--color-popover` |
| `--color-base-200` | `oklch(0.96 0.006 210)` | `--color-muted`, `--color-secondary` |
| `--color-base-300` | `oklch(0.90 0.01 210)` | `--color-border`, `--color-input` |
| `--color-base-content` | `oklch(0.24 0.04 220)` | `--color-foreground`, `--color-card-foreground`, `--color-popover-foreground` |
| `--color-success` | `oklch(0.62 0.15 165)` | `--color-success` |
| `--color-error` | `oklch(0.58 0.18 25)` | `--color-destructive` |
| `--color-warning` | `oklch(0.75 0.15 75)` | `--color-warning` |
| `--color-info` | `oklch(0.60 0.14 230)` | `--color-info` |

### 새로 필요한 `-foreground` 값 (직접 결정)
- `--color-destructive-foreground`: `oklch(0.99 0.005 25)` (기존 error 위에 올라가는 흰색)
- `--color-muted-foreground`: `oklch(0.5 0.02 220)` (중간 밝기 회색, 기존 `base-content/60` 감성)
- `--color-success-foreground`: `oklch(0.99 0.005 165)`
- `--color-warning-foreground`: `oklch(0.22 0.03 75)` (경고색 위 어두운 텍스트)
- `--color-info-foreground`: `oklch(0.99 0.005 230)`
- `--color-ring`: `oklch(0.58 0.13 200 / 0.5)` (기존 포커스 링 값 그대로)

---

## 1. 기본 토큰 치환표

### base-* (배경/텍스트/테두리)

| DaisyUI | shadcn | 비고 |
|---|---|---|
| `bg-base-100` | `bg-card` | **기본**: 카드, 패널, 사이드바, 헤더, 테이블 컨테이너 |
| `bg-base-100` | `bg-background` | **예외**: 페이지 전체 래퍼 (있다면) |
| `bg-base-200` | `bg-muted` | **기본**: 호버 상태, 부드러운 배경 |
| `bg-base-200` | `bg-background` | **예외**: [app/(app)/layout.tsx](../app/(app)/layout.tsx)의 최상위 컨테이너 (페이지 바탕) |
| `hover:bg-base-200` | `hover:bg-muted` | |
| `bg-base-300` | `bg-border` | (거의 안 쓰임) |
| `text-base-content` | `text-foreground` | |
| `text-base-content/30` | `text-muted-foreground/60` | 아주 흐린 텍스트 (캘린더 비활성 날짜) |
| `text-base-content/40` | `text-muted-foreground` | 흐린 텍스트 (세로줄 구분, placeholder 아이콘) |
| `text-base-content/50` | `text-muted-foreground` | |
| `text-base-content/60` | `text-muted-foreground` | |
| `text-base-content/70` | `text-muted-foreground` | 사이드바 비활성 링크 |
| `border-base-300` | `border-border` | 명시적 테두리 색상 |
| `border-r border-base-300` | `border-r border-border` | 방향 + 색상 조합 |

> **`text-base-content/XX`는 opacity 값과 무관하게 대부분 `text-muted-foreground` 하나로 통일**한다. 기존 코드가 여러 단계(/40, /50, /60)를 쓴 건 미세 조정일 뿐 의미 있는 계층이 아니었다. 완전히 달라 보이는 경우에만 `/60` 접미사로 추가 흐림 처리.

### primary

| DaisyUI | shadcn | 비고 |
|---|---|---|
| `bg-primary` | `bg-primary` | 동일 |
| `text-primary-content` | `text-primary-foreground` | 접미사만 변경 |
| `bg-primary text-primary-content` | `bg-primary text-primary-foreground` | 버튼 패턴 |
| `text-primary` | `text-primary` | 동일 (링크, 아이콘, 강조 텍스트) |
| `bg-primary/10` | `bg-primary/10` | 동일 (뱃지, 아이콘 배경) |
| `bg-primary/10 text-primary` | `bg-primary/10 text-primary` | "예정" 뱃지 패턴 |
| `hover:bg-primary/10` | `hover:bg-primary/10` | 고스트 버튼 호버 |
| `bg-primary-content/15` | `bg-primary-foreground/15` | `bg-primary` 섹션 **안**에서 데코 오버레이 (login page) |

### secondary / accent

| DaisyUI | shadcn | 비고 |
|---|---|---|
| `bg-secondary` | `bg-secondary` | 동일 |
| `text-secondary-content` | `text-secondary-foreground` | 접미사 |
| `bg-accent` | `bg-accent` | 동일 |
| `text-accent-content` | `text-accent-foreground` | 접미사 |

> **`neutral` / `neutral-content` 토큰은 정의만 되어 있고 실사용 0건 확인됨** (2025-XX Grep 기준). 2단계 토큰 병합 시 신규 `@theme`에 **추가하지 않고 삭제**한다.

### error → destructive

| DaisyUI | shadcn | 비고 |
|---|---|---|
| `text-error` | `text-destructive` | 에러 텍스트, 필수 표시(*), 일요일, 아이콘 |
| `bg-error` | `bg-destructive` | 표시 바, 뱃지 |
| `bg-error/10` | `bg-destructive/10` | 에러 배너 배경 |
| `bg-error/10 text-error` | `bg-destructive/10 text-destructive` | "미완료" 뱃지 |
| `border-error` | `border-destructive` | destructive 아웃라인 버튼 |
| `border-error/20` | `border-destructive/20` | 에러 배너 테두리 |
| `border-error/30` | `border-destructive/30` | |
| `hover:bg-error/10` | `hover:bg-destructive/10` | 위험 액션 호버 |

### success / warning / info

| DaisyUI | shadcn | 비고 |
|---|---|---|
| `text-success` | `text-success` | **유지** (새 토큰 추가) |
| `bg-success` | `bg-success` | 유지 |
| `bg-success/10 text-success` | `bg-success/10 text-success` | "완료" 뱃지 |
| `border-success/20`, `/30` | `border-success/20`, `/30` | 유지 |
| `hover:bg-success/10` | `hover:bg-success/10` | 유지 |
| `text-info`, `bg-info`, `bg-info/10` | 동일 유지 | 유지 |
| `text-warning`, `bg-warning` | 동일 유지 | 유지 (현재 사용처 거의 없음) |

---

## 2. 자주 반복되는 복합 패턴

실제 코드에서 반복되는 "구절" 단위 치환. 찾아 바꾸기 할 때 이 단위로 하면 안전.

### 기본 버튼 (primary)
```
bg-primary text-primary-content
→ bg-primary text-primary-foreground
```

### 에러 배너 (여러 곳 반복)
```
flex items-center gap-3 rounded-lg p-4 bg-error/10 text-error border border-error/20 text-base
→ flex items-center gap-3 rounded-lg p-4 bg-destructive/10 text-destructive border border-destructive/20 text-base
```

### 성공 배너
```
rounded-lg p-4 bg-success/10 text-success border border-success/20
→ (동일 유지)
```

### 뱃지 — 상태별
```
bg-primary/10 text-primary        → (유지)  [예정]
bg-success/10 text-success        → (유지)  [완료]
bg-error/10 text-error            → bg-destructive/10 text-destructive  [미완료]
bg-base-200 text-base-content     → bg-muted text-foreground  [관리자/직원 라벨]
```

### 카드/패널 컨테이너
```
bg-base-100 rounded-lg border border-base-300
→ bg-card rounded-lg border border-border
```

### 사이드바 활성/비활성 링크
```
isActive ? "bg-primary text-primary-content" : "text-base-content/70 hover:bg-base-200"
→ isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
```

### 사이드바/헤더 자체 배경
```
bg-base-100 border-r border-base-300
→ bg-card border-r border-border
```

### 페이지 바탕 ([app/(app)/layout.tsx](../app/(app)/layout.tsx))
```
bg-base-200
→ bg-background
```
> 단, 이 경우 background 색상이 현재 `base-200`(살짝 어두운 회색)에서 `background`(거의 흰색)로 바뀐다. **의도적 변경**이 아니라면 `--color-background` 값을 기존 `base-200` OKLCH로 설정하는 것도 고려. → **판단 필요**

### "~" 구분자, placeholder 아이콘
```
text-base-content/40
→ text-muted-foreground
```

---

## 3. 컨텍스트 판단 규칙

같은 DaisyUI 클래스가 서로 다른 shadcn 클래스로 매핑되는 경우의 판단 기준.

### `bg-base-100` 판단
- **사이드바/헤더/카드/테이블 래퍼/팝업 메뉴** → `bg-card`
- **페이지 전체 래퍼** (최상위 `<div>`) → `bg-background`
- **드롭다운 내부 메뉴 박스** → `bg-popover`

### `bg-base-200` 판단
- **호버 상태** (`hover:bg-base-200`) → `hover:bg-muted`
- **부드러운 섹션 배경** (코드/인용문 등) → `bg-muted`
- **페이지 바탕** ([app/(app)/layout.tsx](../app/(app)/layout.tsx)) → `bg-background` (단, 색감 판단 필요)
- **뱃지 배경** (역할 표시 등) → `bg-muted`

### `border-base-300` 판단
- **명시적 테두리** (`border border-base-300`) → `border border-border`
- **방향 테두리** (`border-r border-base-300`) → `border-r border-border`
- **투명도 있는 테두리** (`border-base-300/50`) → 현재는 없음, 생기면 `border-border/50`

### `text-base-content/XX` 판단
- **본문 기본색** (`text-base-content` without opacity) → `text-foreground`
- **흐린 보조 텍스트** (/40 ~ /70) → `text-muted-foreground` (단일 톤)
- **매우 흐린 텍스트** (/30) → `text-muted-foreground/60` (필요 시)

---

## 4. CSS 파일 내부 (globals.css) 치환 ★

**클래스명 치환만으로 잡히지 않는 영역**. [app/globals.css](../app/globals.css)에는 클래스가 아닌 CSS 규칙 자체가 있고, 그 안에 **하드코딩된 OKLCH 값과 변수 참조**가 들어있다. 최종 Grep이 `.css`를 제외하기 때문에 **명시적 수동 작업**으로만 처리된다.

### 4.1 폼 요소 전역 스타일 (L37-62)

```css
/* Before */
input:where([type="text"], [type="email"], [type="password"], [type="tel"], [type="number"], [type="date"]),
select,
textarea {
  border: 1px solid var(--color-base-300);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5rem;
  background-color: var(--color-base-100);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input:where(...):focus,
select:focus,
textarea:focus {
  border-color: oklch(0.58 0.13 200 / 0.5);
  box-shadow: 0 0 0 2px oklch(0.58 0.13 200 / 0.15);
}

/* After */
input:where([type="text"], [type="email"], [type="password"], [type="tel"], [type="number"], [type="date"]),
select,
textarea {
  border: 1px solid var(--color-input);          /* base-300 → input */
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5rem;
  background-color: var(--color-background);    /* base-100 → background */
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input:where(...):focus,
select:focus,
textarea:focus {
  border-color: var(--color-ring);                          /* 하드코딩 제거 */
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-ring) 30%, transparent);
}
```

> **메모**: 포커스 링의 box-shadow는 하드코딩 OKLCH의 `/0.15` 투명도를 `color-mix`로 옮겼다. Tailwind 4 / 최신 브라우저 기준 지원. 간단히 하려면 `box-shadow: 0 0 0 2px var(--color-ring);` 한 줄로 두고 `--color-ring`에 이미 투명도가 들어있게 정의하는 것도 대안.

### 4.2 `.data-table` (L65-82)

```css
/* Before */
.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 500;
  color: oklch(0.24 0.04 220 / 0.6);
  border-bottom: 1px solid var(--color-base-300);
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-base-300);
}

/* After */
.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 500;
  color: var(--color-muted-foreground);           /* 하드코딩 → muted-foreground */
  border-bottom: 1px solid var(--color-border);   /* base-300 → border */
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);   /* base-300 → border */
}
```

### 4.3 `@theme` 블록 자체 (L17-34)

2단계에서 shadcn 토큰으로 완전히 대체. 기존 `base-*`, `*-content`, `error`, `neutral` 토큰은 **삭제**한다. 새 블록은 [0. 신규 @theme 토큰](#0-신규-theme-토큰) 섹션 참조.

### 4.4 PWA theme_color 통일 ★

> **발견**: [public/manifest.json:8](../public/manifest.json#L8)의 `theme_color`가 `#570df8` (DaisyUI 기본 보라색, 스캐폴딩 잔재)이고, [app/layout.tsx:11](../app/layout.tsx#L11)의 `viewport.themeColor`가 `#2b3a67` (남색). **둘 다 현재 브랜드색과 무관한 더미 값**이다.

두 파일을 새 `--color-primary` (민트 블루 `oklch(0.58 0.13 200)`)에 맞춰 동일한 hex 값으로 통일한다.

**변환 작업**:
1. `oklch(0.58 0.13 200)`을 hex로 변환 (DevTools의 computed styles 또는 oklch-to-hex 변환기 사용)
2. 대략 `#3ba8c7` 정도 (정확한 값은 변환 시점에 확정)
3. [public/manifest.json](../public/manifest.json)의 `theme_color`와 [app/layout.tsx](../app/layout.tsx)의 `viewport.themeColor`를 **같은 hex 값**으로 설정

```json
// public/manifest.json
{
  "background_color": "#ffffff",
  "theme_color": "#3ba8c7"  // primary OKLCH의 hex 변환값
}
```

```tsx
// app/layout.tsx
export const viewport: Viewport = {
  themeColor: "#3ba8c7",  // 위와 동일
};
```

---

## 5. False Positive 주의 ⚠️

**절대 건드리면 안 되는** 패턴. 일괄 치환 시 구분해야 한다.

| 패턴 | 의미 | 주의 |
|---|---|---|
| `text-base` | **폰트 크기** (`font-size: 1rem`) | 색상 아님. 치환 금지 |
| `!text-base` | 위와 동일, important 수식자 | 치환 금지 |
| `font-base-*` | (있다면) 폰트 family 토큰 | 치환 금지 |

**안전한 Grep 패턴**:
- ❌ `text-base` — 폰트 크기까지 잡힘
- ✅ `text-base-content` — 정확히 색상만
- ✅ `text-base-content[/\b]` — opacity 접미사까지 안전하게

**안전한 치환 규칙**:
- "text-base"로 시작하는 클래스명을 일괄 변환하지 말 것
- 반드시 `text-base-content`, `bg-base-100` 처럼 **하이픈이 이어지는 전체 토큰명**을 매치 단위로 사용
- 파일 수정 후 `text-base`(정확히 이 단어)가 여전히 존재하는지 visual check — 존재해야 정상 (폰트 크기 유지)

---

## 6. Out of Scope — 건드리지 않는 것

이번 마이그레이션에서 **의도적으로 제외**되는 파일/기능. 치환맵에 포함되지 않으며 Grep 검증 대상도 아님.

### 6.1 PDF 증명서 템플릿
- 파일: [lib/pdf/certificate-template.tsx](../lib/pdf/certificate-template.tsx)
- 이유: `@react-pdf/renderer`는 Tailwind 시스템과 완전히 분리된 `StyleSheet.create` 방식. 하드코딩된 `#222`, `#666`, `#333`, `#f5f5f5`, `#999`는 **공식 문서 인쇄를 위한 의도적 흑백 톤**이며 브랜드 컬러가 아니다.
- 조치: **변경 없음**. 건드리지 말 것.

### 6.2 Next.js 스캐폴딩 SVG
- 파일: [public/file.svg](../public/file.svg), [public/globe.svg](../public/globe.svg), [public/window.svg](../public/window.svg)
- 이유: Next.js 초기 생성물, 내부 `#666` 하드코딩. 코드에서 실제 참조 여부 불확실.
- 조치: 이번 작업 무관. 별도로 사용처 확인 후 미사용이면 삭제 고려.

### 6.3 다크 모드
- shadcn은 기본적으로 `.dark` variant 토큰을 함께 생성하지만, 이 SaaS는 **단일 라이트 모드**만 지원.
- 조치: `shadcn init` 직후 `.dark` 블록이 생성되면 **삭제**. 또는 값이 비어있어도 유지 가능(무해). 사용하지 않는 걸로 합의.

### 6.4 `--radius` 시스템
- shadcn은 `--radius: 0.5rem` 변수 + `rounded-sm/md/lg` 변종을 제공.
- 현재 프로젝트는 `rounded-lg`, `rounded-xl`을 직접 사용 중.
- 조치: **미도입**. `shadcn init`이 `--radius` 변수를 추가하더라도 기존 `rounded-lg` 사용 코드는 그대로 둔다. 통합 리팩토링은 별도 작업.

### 6.5 폰트 변수
- shadcn은 `--font-sans`, `--font-mono` 변수를 제공.
- 현재 Pretendard가 [globals.css:13](../app/globals.css#L13)의 `html { font-family: "Pretendard", ... }`로 전역 적용 중.
- 조치: **판단 보류**. `shadcn init` 시 해당 변수가 생성되면 그대로 두되 `html` 전역 규칙을 우선. 미사용으로 간주.

### 6.6 애니메이션 변수 / `tw-animate-css`
- shadcn의 drawer, dialog 등은 `tw-animate-css`를 쓰기도 함.
- 현재 Select만 설치할 예정 → 당장 필요 없음.
- 조치: 필요 시 해당 컴포넌트 설치 시점에 자동 설치되게 두고, 미리 붙이지 않음.

### 6.7 `react-hook-form` 도입
- 별도 작업. 이번 범위 아님. [shadcn-migration-task.md](./shadcn-migration-task.md)의 Out of Scope 참조.

---

## 7. 설치할 shadcn 컴포넌트

### 이번 작업에서 추가
- [ ] `select` — [visits-list.tsx](../app/(app)/visits/visits-list.tsx) 드롭다운 4개 교체용

### 이번 작업 아님 (향후)
- `button` — Button 컴포넌트 공통화 필요 시
- `dialog` — 확인 모달 등
- `dropdown-menu` — 헤더 유저 메뉴 등
- `command` — 검색형 combobox 필요 시
- `popover` — 일반 팝오버

---

## 8. 발견된 엣지케이스 (작업 중 추가)

> 파일별 치환 작업 진행하면서 예상 밖 패턴이 나오면 여기에 기록하고 합의된 규칙을 적는다.

- (비어있음)

---

## 9. 최종 검증 Grep 패턴

### 9.1 클래스명 잔재 검증 (`.css` 제외)

작업 완료 시 다음 패턴이 `.md`, `.css` 제외 기준으로 **0건**이어야 함:

```
base-100|base-200|base-300|base-content|primary-content|secondary-content|accent-content|neutral-content|bg-error|text-error|border-error
```

검증 명령 예시:
```
Grep(pattern: "base-100|base-200|base-300|base-content|primary-content|secondary-content|accent-content|neutral-content|bg-error|text-error|border-error",
     glob: "!{*.md,*.css}")
```

> `text-base`(폰트 크기)는 이 패턴에 매치되지 않음 — 안전.

### 9.2 CSS 파일 내부 검증 (`globals.css` 단독)

6단계 완료 후 [app/globals.css](../app/globals.css)에 다음이 **0건**이어야 함:

```
--color-base-|--color-neutral|--color-error|--color-primary-content|--color-secondary-content|--color-accent-content
```

즉, `@theme` 블록에 shadcn 토큰 + `success/warning/info` 확장만 남아있어야 한다.

또한 CSS 규칙 본문에 하드코딩 OKLCH 값이 **없어야** 한다:

```
Grep(pattern: "oklch\(",
     path: "app/globals.css")
```

결과는 `@theme` 블록 내부(변수 정의)에만 있어야 하고, `input:focus`, `.data-table` 등 규칙 본문에는 **0건**.

### 9.3 PWA 색상 일치 검증

수동 확인:
- [public/manifest.json](../public/manifest.json)의 `theme_color`
- [app/layout.tsx](../app/layout.tsx)의 `viewport.themeColor`

**두 값이 동일한 hex 문자열**이어야 함 (예: 둘 다 `"#3ba8c7"`).
