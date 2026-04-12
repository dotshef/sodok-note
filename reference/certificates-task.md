# 소독증명서 HWPX 전환 작업 정의

## 배경

현재 소독증명서는 `@react-pdf/renderer`로 자체 레이아웃 PDF를 생성하고 있다.
이를 법정 양식(별지 제28호서식) 기반 HWPX 생성으로 교체한다.

- 법정 양식 템플릿: `lib/template/소독증명서_템플릿.hwpx`
- PoC (Python): `reference/hwp-poc/poc_hwpx.py`
- PoC 워크플로우 문서: `reference/hwp-poc/hwpx-certificate-injection.md`

## 현재 구조

### 생성 API
- `app/api/certificates/generate/route.ts`
- 흐름: 방문/고객/업체 데이터 조회 → PDF 생성 → Supabase Storage 업로드 → DB 기록

### PDF 템플릿
- `lib/pdf/certificate-template.tsx` — React PDF 컴포넌트 (자체 레이아웃)
- 법정 양식이 아닌 자체 디자인

### DB 스키마
- `certificates` 테이블: id, visit_id, tenant_id, certificate_number, pdf_url, sent_at, sent_to, created_at
- `certificate_number` 형식: `CERT-YYYYMMDD-NNNNN`

### 스토리지
- 버킷: `certificates` (private)
- 경로: `certificates/{tenant_id}/{certificate_number}.hwpx`

---

## 결정 사항

### 번호 체계

- **certificate_number** (시스템 관리용): `CERT-{code}-{순번5자리}` (예: `CERT-C00001-00007`)
- **issue_number** (양식 인쇄용 "제 ○ 호"): 사용자가 직접 입력 (text)
- 둘은 별개. certificate_number는 자동 채번, issue_number는 수동 입력

### 고객 코드

- `clients` 테이블에 `code` 컬럼 추가
- 형식: `C00001` ~ `C99999` (5자리, tenant 내 순차 증가)
- tenant 내에서 유니크 (`UNIQUE (tenant_id, code)`)
- 삭제된 번호는 재사용하지 않음

---

## 작업 목록

### 0. DB 스키마 변경 (선행)

**선행 작업**: `reference/client-task.md` — clients 테이블 확장 (code, volume, contact_position)

**certificates 테이블**:
- `issue_number text` 컬럼 추가 — 양식에 찍히는 "제 ○ 호" (사용자 입력)
- `pdf_url` → `file_url`로 rename
- `certificate_number` 채번 방식 변경: `CERT-YYYYMMDD-NNNNN` → `CERT-{code}-{순번}`

**schema.sql 동기화**.

### 1. HWPX 생성 모듈 (Python PoC → TypeScript 포팅)

**파일**: `lib/hwpx/generate-certificate.ts`

Python PoC(`poc_hwpx.py`)의 로직을 TypeScript로 포팅한다.

**핵심 로직**:
1. `lib/template/소독증명서_템플릿.hwpx`를 ZIP으로 읽기
2. `Contents/section0.xml`을 XML 파싱
3. 셀 매핑에 따라 데이터 주입 (방식 A/B/C)
4. XML 직렬화 + ZIP 재생성 → Buffer 반환

**의존성**:
- `jszip` — ZIP 읽기/쓰기
- `fast-xml-parser` 또는 `xmldom` — XML 파싱/수정/직렬화

**입력 인터페이스**:
```ts
interface CertificateInput {
  issueNumber: string;        // "제 ○ 호"에 들어갈 값 (사용자 입력)
  businessName: string;       // 상호(명칭) — 고객 시설명
  areaM2: string;             // 면적 ㎡
  areaM3: string;             // 용적 ㎥
  address: string;            // 소재지 — 시설 주소
  position: string;           // 직위
  managerName: string;        // 성명 — 시설 관리자
  periodStart: string;        // 소독기간 시작
  periodEnd: string;          // 소독기간 종료
  disinfectionType: string;   // 종류 (일반소독, 연무소독 등)
  chemicals: string;          // 약품 사용 내용
  year: string;               // 발급 연도
  month: string;              // 발급 월
  day: string;                // 발급 일
  operatorName: string;       // 소독실시자 업체명
  operatorAddress: string;    // 소독실시자 소재지
  operatorCeo: string;        // 소독실시자 대표자명
}
```

**셀 매핑** (상세 주입 방법은 `hwpx-certificate-injection.md` 섹션 5 참조):

| 셀 | 필드 | 방식 |
|----|------|------|
| cell[1] | issueNumber | C (직접 수정) |
| cell[3] | businessName | B (run 추가) |
| cell[4] | areaM2, areaM3 | C (직접 수정) |
| cell[5] | address | B (run 추가) |
| cell[7] | position | B (run 추가) |
| cell[8] | managerName | B (run 추가) |
| cell[12] | periodStart, periodEnd | C (직접 수정) |
| cell[15] | disinfectionType | A (이어붙이기) |
| cell[16] | chemicals | A (이어붙이기) |
| cell[17] | year, month, day | C (직접 수정) |
| cell[19] | operatorName, operatorAddress, operatorCeo | C (직접 수정) |

### 2. generate API 수정

**파일**: `app/api/certificates/generate/route.ts`

**변경 사항**:
- `@react-pdf/renderer` 의존 제거 → HWPX 생성 모듈 호출
- 업로드 경로: `certificates/{tenant_id}/{certificate_number}.hwpx`
- contentType: `application/octet-stream`
- `certificate_number` 채번: `CERT-{code}-{해당 고객 내 순번}`
- `issue_number`는 클라이언트에서 전달받음

**데이터 매핑** (기존 조회 → CertificateInput):

| CertificateInput 필드 | 출처 |
|---|---|
| issueNumber | 클라이언트에서 전달 (사용자 입력) |
| businessName | `client.name` |
| areaM2 | `client.area` |
| areaM3 | `client.volume` (nullable → 빈 칸) |
| address | `client.address` |
| position | `client.contact_position` |
| managerName | `client.contact_name` |
| periodStart / periodEnd | `visit.completed_at` (시작일 = 종료일) |
| disinfectionType | `visit.method` |
| chemicals | `visit.chemicals_used.join(", ")` |
| year, month, day | 발급일 (현재 날짜) |
| operatorName | `tenant.name` |
| operatorAddress | `tenant.address` |
| operatorCeo | `tenant.owner_name` |

### 3. 다운로드 API

**파일**: `app/api/certificates/[id]/download/route.ts`

**흐름**:
1. 세션 검증 + tenant_id 확인
2. DB에서 certificate 조회 (file_url 또는 경로 조합)
3. `supabase.storage.from('certificates').download(path)`
4. Response로 파일 반환 (Content-Disposition: attachment)

### 4. UI 연결

- 증명서 생성 폼에 `issue_number` 입력 필드 추가
- 다운로드 버튼

### 5. 기존 PDF 코드 정리

**제거 대상**:
- `lib/pdf/certificate-template.tsx`
- `@react-pdf/renderer` 패키지 (다른 곳에서 사용하지 않는 경우)

