# Phase 5: 소독증명서 PDF 생성

## 목표
소독 완료 후 법정 양식 기반 소독증명서 PDF 자동 생성, 다운로드 및 링크 공유

## 선행 조건
- Phase 4 완료 (방문 완료 처리)

## 작업 목록

### 5-1. 증명서 PDF 템플릿
- [x] 법정 양식 기반 PDF 레이아웃 설계 (`lib/pdf/certificate-template.tsx`, @react-pdf/renderer)
- [x] 포함 항목: 업체명, 업체 로고, 소독일시, 소독 장소, 시설명, 사용 약제, 소독 방법, 대표자명
- [x] 증명서 번호 자동 채번 (CERT-YYYYMMDD-00001 형식, 서버에서 직접 처리)

### 5-2. 증명서 생성 플로우
- [x] 방문 상세 페이지에 "증명서 생성" 버튼 추가 (`app/(app)/visits/[id]/page.tsx`)
- [x] 버튼 클릭 → PDF 즉시 생성 (`app/api/certificates/generate/route.ts`)
- [x] 생성된 PDF를 Supabase Storage에 업로드
- [x] `certificates` 테이블에 기록 (visit_id, certificate_number, pdf_url)

### 5-3. 증명서 뷰어
- [x] PDF 다운로드 버튼 (방문 상세 페이지)
- [x] 공유 링크 복사 버튼 (Supabase Storage public URL)
- [x] 증명서 재발급 (동일 visit에 대해 재생성)
- [ ] PDF 미리보기 페이지

### 5-4. 발급 이력
- [x] 증명서 발급 이력 목록 (`app/(app)/certificates/page.tsx`, 회사 전체)
- [x] 고객별 증명서 발급 이력 (고객 상세 페이지에서 이미 연동)

### 5-5. 업체 설정 — 로고 업로드
- [x] 설정 페이지에 로고 업로드 기능 (`app/(app)/settings/page.tsx`)
- [x] Supabase Storage에 로고 저장 (`app/api/settings/logo/route.ts`)
- [x] 증명서 생성 시 로고 자동 삽입
- [x] 업체 정보 수정 (업체명, 사업자번호, 대표자명, 전화번호, 주소)
- [x] 플랜 정보 표시

## 산출물
- 소독증명서 PDF 생성/다운로드/공유/재발급
- 증명서 발급 이력 관리
- 업체 로고 업로드 + 설정 페이지

## 미완료 항목
- PDF 미리보기 페이지 (현재는 다운로드 + 링크 공유로 대체)
