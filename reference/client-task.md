# 고객(clients) 테이블 확장 작업

## 배경

소독증명서 HWPX 전환을 위해 clients 테이블에 필드 추가가 필요하다.
이 작업은 증명서 작업의 선행 조건이다.

## DB 스키마 변경

### 추가 컬럼

| 컬럼 | 타입 | nullable | 설명 |
|------|------|----------|------|
| `code` | text | NOT NULL (신규 생성 시) | 고객 코드 (`C00001`) |
| `volume` | numeric | YES | 용적 ㎥ |
| `contact_position` | text | YES | 관리자 직위 |

### 제약 조건

- `UNIQUE (tenant_id, code)` — tenant 내 고객 코드 유니크

### 마이그레이션 SQL

```sql
ALTER TABLE clients ADD COLUMN code text;
ALTER TABLE clients ADD COLUMN volume numeric;
ALTER TABLE clients ADD COLUMN contact_position text;
ALTER TABLE clients ADD CONSTRAINT unique_tenant_code UNIQUE (tenant_id, code);
```

### 기존 고객 코드 부여 (마이그레이션)

기존 고객에 `created_at` 순서대로 코드를 부여한다:

```sql
WITH numbered AS (
  SELECT id, tenant_id,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) AS rn
  FROM clients
)
UPDATE clients
SET code = 'C' || LPAD(numbered.rn::text, 5, '0')
FROM numbered
WHERE clients.id = numbered.id;
```

## 고객 코드 채번 로직

### 규칙
- 형식: `C00001` ~ `C99999` (5자리, tenant 내 순차 증가)
- 삭제된 번호는 재사용하지 않음
- UNIQUE 제약으로 동시 생성 충돌 방어

### 구현

고객 생성 시 해당 tenant의 최대 코드를 조회하여 +1:

```ts
async function generateClientCode(supabase, tenantId: string): Promise<string> {
  const { data } = await supabase
    .from("clients")
    .select("code")
    .eq("tenant_id", tenantId)
    .order("code", { ascending: false })
    .limit(1)
    .single();

  if (!data?.code) return "C00001";

  const currentNum = parseInt(data.code.replace("C", ""), 10);
  return `C${String(currentNum + 1).padStart(5, "0")}`;
}
```

## 코드 변경 대상

### 1. 고객 생성 API
- 고객 생성 시 `code` 자동 채번 로직 추가

### 2. 고객 등록/수정 UI
- `volume` (용적) 입력 필드 추가 (선택)
- `contact_position` (직위) 입력 필드 추가 (선택)
- `code`는 자동 생성이므로 읽기 전용 표시

### 3. schema.sql 동기화
