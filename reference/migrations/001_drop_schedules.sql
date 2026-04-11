-- 001. schedules 테이블 제거
-- 사전 조건: 코드에서 schedules/schedule_id 참조가 모두 제거된 상태여야 함.
-- 본 마이그레이션을 먼저 실행하면 고객 목록/상세 화면이 쿼리 에러로 깨진다.
-- 자세한 배경은 reference/schedule-delete.md 참조.

alter table visits drop column if exists schedule_id;
drop table if exists schedules;
