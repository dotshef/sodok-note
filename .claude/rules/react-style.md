# React 스타일 규칙 (deny-list)

매 파일 작성/수정 시 체크. 금지 패턴이 나오면 안 됨.

## 폰트 크기
- 최소 `text-base` (16px). 모바일/데스크탑 동일.
- **금지**: `text-sm`, `text-xs` (뱃지·보조 텍스트 포함 예외 없음)

## 반응형 브레이크포인트
`md` (768px) / `lg` (1024px) **두 개만** 사용.

- **금지**: `sm:`, `xl:`, `2xl:`
- **금지**: 같은 페이지에서 `md`와 `lg`를 섞어 전환 타이밍을 다르게 만드는 것 (내비게이션 섀시는 예외)

### `lg` (1024px) — 내비게이션/레이아웃 섀시
- 사이드바/LNB 노출: `hidden lg:flex`
- 하단 탭 바 숨김: `lg:hidden`
- 3컬럼 이상 그리드 (대시보드 `lg:grid-cols-3`, `lg:grid-cols-4`)
- 로그인 히어로, 캘린더 사이드 위젯 등 보조 컬럼

### `md` (768px) — 본문 콘텐츠 블록
- 목록 페이지 카드↔테이블 전환: `md:hidden` / `hidden md:block`
- 상세 페이지 2분할 카드 레이아웃: `md:grid-cols-2`
- 필터바/툴바 가로 배치
- 같은 페이지 안에서는 동일 기준 유지 (상단 카드 `md`면 하단 리스트도 `md`)

## 드롭다운 / select
- **금지**: 네이티브 `<select>` / `<option>` 사용 (필터·폼 어디서든 예외 없음)
- **필수**: `@/components/ui/filter-select`의 `FilterSelect` 사용
  - 사용 예: `<FilterSelect value={...} onChange={(v) => ...} options={[{ value, label }, ...]} />`
  - "선택 안 함" 옵션이 필요하면 `{ value: "", label: "..." }`을 옵션 배열 맨 앞에 추가
- 이유: 모바일에서 OS 기본 select UI는 디자인 일관성·접근성·키보드 동작이 깨짐. 프로젝트는 div 기반 커스텀 드롭다운으로 통일.
