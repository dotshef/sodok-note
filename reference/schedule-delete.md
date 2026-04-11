# schedules 제거 및 방문 일정 등록 작업

## 배경

`schedules` 테이블은 설계상 "정기 방문 규칙"을 담당하도록 설계됐지만, 실제 코드에서는 사실상 dead weight다.

- **`cycle_months`는 안 읽힘** — [app/api/visits/[id]/route.ts:75-76](app/api/visits/[id]/route.ts#L75-L76)에서 다음 방문 주기를 결정할 때 `schedules.cycle_months`가 아니라 `getCycleMonths(facilityType)` 상수에서 가져온다.
- **`next_visit_date`는 insert/update만 되고 read가 없음** — 캘린더/대시보드/상세 어디도 이 컬럼을 읽지 않는다.
- **`user_id`(기본 담당자)도 안 쓰임** — 고객 등록 시 첫 visit에 user_id를 넣지 않고, 다음 visit 체인에서는 이전 visit의 user_id를 복사한다.
- **`is_active`도 어디서도 참조되지 않음**.

즉 schedules는 "고객 등록 시 한 번 insert되고 다시는 의미 있게 쓰이지 않는 테이블"이다. 제거하고, visit 등록은 "방문 관리" 페이지에서 사용자가 직접 하도록 전환한다.

## 확정된 결정 사항

| 항목 | 결정 |
|---|---|
| 같은 고객·같은 날짜 중복 방문 등록 | **허용** |
| 등록 폼의 정기 반복 옵션 | **제외** (지금은 단발 등록만) |
| member(기사) 권한 | **등록 불가** (admin 전용) |
| 과거 날짜 등록 | **허용** |
| 방문 완료 시 다음 visit 자동 생성 | **제거** (모든 visit은 수동 등록) |
| 고객 등록 시 첫 visit 자동 생성 | **제거** (고객 등록과 방문 등록 분리) |

## 정기 반복 로직의 전면 제거

schedules 제거와 함께 **자동 visit 생성 로직 2개**를 모두 걷어낸다. 모든 visit은 관리자가 "방문 일정 등록"으로 명시적으로 만든다.

1. **방문 완료 시 다음 visit 자동 생성 제거** — [app/api/visits/[id]/route.ts:73-101](app/api/visits/[id]/route.ts#L73-L101)의 블록 삭제
2. **고객 등록 시 첫 visit 자동 생성 제거** — [app/api/clients/route.ts:90-123](app/api/clients/route.ts#L90-L123)의 schedules + 첫 visit insert 블록 삭제

**새로운 사용자 흐름**: 고객 등록 → (자동 생성 없음) → 관리자가 방문 관리 페이지에서 "방문 일정 등록"으로 수동 추가.

이후 정기 반복 기능이 필요해지면 별도 작업으로 재도입한다.

---

## 작업 범위

### A. DB 스키마

#### A-1. `reference/schema.sql` 수정
- `schedules` 테이블 정의 블록 전체 삭제 ([reference/schema.sql:46-57](reference/schema.sql#L46-L57))
- `visits.schedule_id` 컬럼 삭제 ([reference/schema.sql:62](reference/schema.sql#L62))

#### A-2. 실 DB 마이그레이션 SQL 작성
```sql
alter table visits drop column schedule_id;
drop table schedules;
```
- 기존 데이터를 유지한 채 실행 가능 (visits의 schedule_id는 애초에 읽히지 않으므로 데이터 손실 없음)
- Supabase 콘솔에서 수동 실행 예정이면 이 SQL을 별도 파일(`reference/migrations/` 등)에 남길지 결정 필요

### B. 백엔드 — schedules 참조 제거

#### B-1. [app/api/clients/route.ts](app/api/clients/route.ts)
- 90-123행 제거 (schedules insert + 첫 visit insert 블록 전체)
- 고객 등록 핸들러는 clients insert만 수행하도록 단순화
- `getCycleMonths`, `firstVisitDate` 계산 및 관련 import 제거
- 요청 바디에서 `firstVisitDate` 필드가 있었다면 제거 (validation도 함께 정리)

**영향**: 기존에는 고객을 등록하면 첫 visit이 자동 생성됐지만, 앞으로는 관리자가 "방문 일정 등록"에서 직접 만들어야 한다.

#### B-2. [app/api/visits/[id]/route.ts](app/api/visits/[id]/route.ts)
- 73-101행 제거 (다음 visit 자동 생성 블록 전체)
- complete 액션은 현재 visit을 `completed` 상태로 업데이트하고 종료
- `addMonths`, `getCycleMonths`, `FacilityTypeId` import 중 사용처 없어진 것 정리
- update 후 `.select("*, clients(id, facility_type)")`에서 clients 조인이 더 이상 필요 없으면 제거
- `visit.schedule_id` 참조 제거

#### B-3. [app/api/visits/route.ts](app/api/visits/route.ts)
- GET의 select 문에서 `schedule_id` 참조 없음 확인 (현재 없음)

#### B-4. 고객 목록 — schedules read 경로 제거

[app/api/clients/route.ts:24](app/api/clients/route.ts#L24)
- `.select("*, schedules(next_visit_date)", ...)` → `.select("*", ...)`로 변경

[app/(app)/clients/page.tsx](app/(app)/clients/page.tsx)
- `Client` 타입의 `schedules` 필드 제거 (16행)
- `getNextVisitDate()` 함수 제거 (61-64행)
- 목록 테이블의 **"다음 방문 예정일" 컬럼 제거** — 헤더와 body 셀 모두 삭제 (컬럼 인덱스 조정 필요)

#### B-5. 고객 상세 — schedules read 경로 정리

[app/api/clients/[id]/route.ts:22](app/api/clients/[id]/route.ts#L22)
- `schedules(id, cycle_months, next_visit_date, user_id, is_active)` 조인 제거
- 반환 JSON에서 schedules 필드 제거
- 대신 `clients.facility_type`으로 주기를 응답에 같이 내려주고 싶다면, `lib/constants/facility-types.ts`의 `getCycleMonths`를 서버에서 호출해 `cycleMonths` 필드로 덧붙여 반환 (클라이언트에서 상수를 직접 import해 렌더해도 됨 — 아래 B-6 참고)

[app/(app)/clients/[id]/page.tsx](app/(app)/clients/[id]/page.tsx)
- `Schedule` 타입과 `client.schedules` 필드 제거 (38행 및 상단 타입 정의)
- `activeSchedule` 변수 제거 (102행)
- **"다음 방문 예정" 블록 전체 제거** ([app/(app)/clients/[id]/page.tsx:173-183](app/(app)/clients/[id]/page.tsx#L173-L183))
  - 우측 컬럼 레이아웃 재정리 필요 (요약 통계 블록을 위로 올리거나 빈 공간 조정)
- **"소독 주기" 필드는 유지** — 참고용으로만 표시
  - [app/(app)/clients/[id]/page.tsx:150](app/(app)/clients/[id]/page.tsx#L150)에서 `activeSchedule.cycle_months` 대신 **`getCycleMonths(client.facility_type as FacilityTypeId)`** 로 대체
  - `lib/constants/facility-types`의 `getCycleMonths` / `FacilityTypeId` import 추가
  - 값이 없으면 `"-"` 표시

#### B-6. 기타 schedules 참조 전수 조사
- `Grep "schedules|schedule_id"` 로 프로젝트 전체 재확인
- 타입 정의, constants, 문서(`reference/db-scheme.md`, `reference/phase*.md`) 업데이트
- [app/(app)/visits/[id]/page.tsx:21](app/(app)/visits/[id]/page.tsx#L21)의 `schedule_id: string | null` 타입 필드 제거

### C. 백엔드 — `POST /api/visits` 신설

#### C-1. [app/api/visits/route.ts](app/api/visits/route.ts)에 POST 핸들러 추가

**권한**: admin만 허용. member는 403.

**요청 바디**:
```ts
{
  clientId: string;     // 필수
  scheduledDate: string; // 필수, YYYY-MM-DD
  userId?: string;      // 선택 (담당 기사)
  notes?: string;       // 선택
}
```

**검증** — [lib/validations/visit.ts](lib/validations/visit.ts) 신설 (파일 없으면 생성)
- `clientId` — uuid, 필수
- `scheduledDate` — YYYY-MM-DD 형식, 필수, **과거 날짜 허용**
- `userId` — uuid, 선택
- `notes` — string, 선택, max 1000자 정도

**서버 로직**:
1. 세션 확인, admin 권한 체크
2. Zod 검증
3. `clientId`가 같은 tenant 소속인지 확인
4. `userId`가 제공되면 같은 tenant 소속인지 확인
5. **중복 체크 없음** (결정 사항 1에 따라)
6. visits insert:
   ```ts
   {
     client_id, tenant_id, user_id: userId || null,
     scheduled_date, status: 'scheduled',
     notes: notes || null,
     created_at: new Date().toISOString(),
   }
   ```
7. 생성된 visit id 반환

### D. 프론트 — 방문 일정 등록 UI

#### D-1. 진입점
"방문 관리" 페이지([reference/visit-page-option.md](reference/visit-page-option.md) 옵션 B 기반)가 아직 없다면, 임시 진입점은:
- 대시보드 우측 상단 "방문 일정 등록" 버튼, 또는
- 고객 상세 페이지 "방문 추가" 버튼 (기존 방문 이력 섹션 위)

**권장**: 방문 관리 페이지 구현과 같이 진행하고, 그 페이지 우측 상단에 `[+ 방문 일정 등록]` 버튼을 배치. 이 문서 이후 visit-page-option.md 옵션 B 작업이 이어진다는 전제.

#### D-2. 폼 형태 — 모달 vs 별도 페이지

**권장: 모달** (`components/visits/visit-create-modal.tsx`)
- 입력 필드가 4개로 적음
- 등록 후 목록으로 바로 돌아가는 흐름이 자연스러움
- daisyUI `<dialog>` 사용

별도 페이지(`/visits/new`)로 하는 경우는 필드가 늘어나거나 반복 옵션이 추가될 때 재검토.

#### D-3. 폼 필드
```
┌──────────────────────────────────────┐
│ 방문 일정 등록                        │
├──────────────────────────────────────┤
│ 고객 시설 *   [검색 가능 Select   ▼] │
│ 예정일 *      [2026-04-15        📅] │
│ 담당 기사     [미배정            ▼] │
│ 메모          [                    ] │
│               [                    ] │
│                                       │
│             [취소]  [등록]           │
└──────────────────────────────────────┘
```

- **고객 시설** — `/api/clients`에서 목록 로드, 검색 가능한 select (combobox). 현재 active한 고객만 노출
- **예정일** — `<input type="date">`. min/max 없음 (과거 허용)
- **담당 기사** — admin은 `/api/users`(또는 members API)에서 active member 목록 로드, 기본값 "미배정"
- **메모** — `<textarea rows="3">`, 선택

**클라이언트 검증** (react-hook-form + zod):
- 고객 필수, 예정일 필수
- 나머지 선택

**제출 후**: 모달 닫고 목록 새로고침. 또는 `/visits/[id]`로 이동할지 결정 필요(사용자 흐름에 따라).

#### D-4. 사용자 컴포넌트/API 의존성
- 담당 기사 선택용 API가 이미 있는지 확인: `/api/members` 또는 `/api/users` 존재 여부
- 없으면 이 작업에서 `GET /api/users?role=member&active=true` 신설 필요

---

## 작업 순서 (권장)

> **원칙**: 코드에서 schedules read/write 경로를 먼저 전부 걷어낸 뒤, 마지막에 DB 테이블을 drop한다. DB를 먼저 drop하면 고객 목록·상세 페이지가 쿼리 에러로 깨진다.

1. **A. DB 스키마 문서/SQL 작성** (실 DB는 마지막 단계에서 적용)
2. **B. schedules 참조 제거** — 작성/읽기 경로 모두
   - B-1 고객 등록 핸들러
   - B-2 visit 완료 핸들러
   - B-3 POST /api/visits용 베이스 확인
   - B-4 고객 목록 (API + 페이지)
   - B-5 고객 상세 (API + 페이지, "소독 주기"는 facility_type 상수로 전환)
   - B-6 전수 재확인
3. **C. POST /api/visits 추가** + zod validation
4. **D. 등록 UI 추가** (모달)
5. **수동 테스트**
   - 고객 등록 → visit 자동 생성 안 되는지
   - 고객 목록/상세 → 에러 없이 렌더, "다음 방문 예정" 표시가 없어졌는지, "소독 주기"는 facility_type 기반으로 정상 표시되는지
   - 방문 완료 → 다음 visit 자동 생성 안 되는지
   - 방문 일정 등록 → visits에 정상 insert되는지
   - member 계정으로 등록 시 403
   - 같은 고객·같은 날짜 2건 등록 시 허용되는지
   - 과거 날짜 등록 후 캘린더/목록에 정상 표시되는지
6. **실 DB 마이그레이션 SQL 실행** — 이 시점에 코드가 이미 schedules를 전혀 참조하지 않아야 함
7. **문서 업데이트** — `reference/db-scheme.md`, 관련 phase 문서

---

## 영향 범위 요약

| 범주 | 파일 | 변경 내용 |
|---|---|---|
| 스키마 | [reference/schema.sql](reference/schema.sql) | schedules 테이블 삭제, visits.schedule_id 삭제 |
| 스키마 | [reference/db-scheme.md](reference/db-scheme.md) | 문서 업데이트 |
| 실 DB | Supabase | 마이그레이션 SQL 실행 |
| 백엔드 | [app/api/clients/route.ts](app/api/clients/route.ts) | schedules insert + 첫 visit insert 제거, 목록 select에서 schedules 조인 제거 |
| 백엔드 | [app/api/clients/[id]/route.ts](app/api/clients/[id]/route.ts) | 상세 select에서 schedules 조인 제거 |
| 백엔드 | [app/api/visits/[id]/route.ts](app/api/visits/[id]/route.ts) | 다음 visit 자동 생성 블록 제거 |
| 백엔드 | [app/api/visits/route.ts](app/api/visits/route.ts) | POST 핸들러 신설 |
| 프론트 | [app/(app)/clients/page.tsx](app/(app)/clients/page.tsx) | "다음 방문 예정일" 컬럼 제거 |
| 프론트 | [app/(app)/clients/[id]/page.tsx](app/(app)/clients/[id]/page.tsx) | "다음 방문 예정" 블록 제거, "소독 주기"는 facility_type 상수로 전환 |
| 프론트 | [app/(app)/visits/[id]/page.tsx](app/(app)/visits/[id]/page.tsx) | 타입에서 `schedule_id` 제거 |
| 검증 | `lib/validations/visit.ts` | 신설 |
| 프론트 | `components/visits/visit-create-modal.tsx` | 신설 |
| 프론트 | 방문 관리 페이지 또는 대시보드 | 등록 버튼 추가 |

## 남은 열린 질문

1. 등록 후 이동 경로 — 목록 새로고침 vs `/visits/[id]` 이동
2. 담당 기사 선택용 API가 이미 존재하는지 확인 필요
3. 마이그레이션 SQL을 어디에 커밋할지 (`reference/migrations/` 신설 여부)
