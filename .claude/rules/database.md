---
description: DB 관련 규칙. Supabase 쿼리, 스키마, 마이그레이션 작업 시 적용.
globs: ["**/*.sql", "lib/supabase/**", "app/api/**"]
---

# DB 규칙

## 금지 사항
- DB 트리거 사용 금지
- `default now()` 등 DB 레벨 기본값 금지 — 서버에서 직접 타임스탬프 주입
- Supabase RLS 사용 금지 — 서버에서 tenant_id 기반 직접 필터링
- Supabase Auth 사용 금지 — users 테이블에 email/password_hash 직접 관리
- DB 시퀀스 사용 금지 — 채번 로직은 서버에서 처리

## 필수 사항
- 모든 쿼리에 tenant_id 조건 명시적 추가
- Supabase 클라이언트는 `getSupabase()` (lazy 초기화) 사용
- INSERT/UPDATE 시 created_at, updated_at을 `new Date().toISOString()`으로 직접 전달

## visits.client_* 박제 컬럼
- visits 테이블의 `client_*` 컬럼은 **방문 생성 시점의 고객 정보 박제값** (immutable)
- clients 테이블이 나중에 수정돼도 visit의 client_* 값은 변하지 않음 — 증명서와 항상 일치 보장
- 방문 목록·상세 화면, 검색·필터, 증명서 생성 모두 **박제값 기준** (`clients` join으로 표시 금지)
- 방문 후 고객 정보가 바뀌어 반영하려면 방문을 삭제하고 재등록해야 함 (live sync 아님)
- `clients` join은 "고객 상세로 이동" 같은 link 용도로만 사용 (id만 필요)