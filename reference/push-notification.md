# 푸시 알림 구현 계획

> 작성일: 2026-04-21
> 대상: 방역매니저 (Next.js 16 + PWA + Supabase)

Web Push (VAPID 기반)을 활용한 푸시 알림 구현. FCM/APN 직접 연동 없이 브라우저 표준만으로 Chrome/Firefox/Edge/Safari(PWA) 커버.

---

## 1. 아키텍처

```
[클라이언트]
  사용자가 알림 권한 허용
    ↓
  Service Worker 등록 (next-pwa 자동)
    ↓
  PushManager.subscribe(VAPID public key)
    ↓
  구독 객체(endpoint + keys) 서버로 전송
    ↓
[서버 - Next.js API Route]
  push_subscriptions 테이블에 저장

[알림 발송 시점]
  트리거 발생 (cron or 이벤트)
    ↓
  web-push.sendNotification(subscription, payload, { vapidDetails })
    ↓
  브라우저 푸시 서비스 (FCM/Mozilla/APN) → 사용자 기기
    ↓
  Service Worker의 'push' 이벤트 → showNotification()
```

---

## 2. 사용할 라이브러리

### 설치 필요

```bash
npm install web-push
npm install -D @types/web-push
```

### 이미 설치됨

- `@ducanh2912/next-pwa` — Service Worker 자동 생성 (Workbox 기반)
- `@supabase/supabase-js` — 구독 정보 저장
- `jose` — JWT 세션

### 브라우저 표준 (설치 불필요)

- Notifications API
- Push API
- Service Worker API

---

## 3. 사전 준비 작업

### 3-1. VAPID 키 생성

```bash
npx web-push generate-vapid-keys
```

출력된 Public Key / Private Key를 `.env`에 저장.

### 3-2. 환경 변수 추가

`.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:admin@bangyeokmanager.com
```

- `NEXT_PUBLIC_` 접두사 붙인 것만 클라이언트 노출
- Private Key는 절대 클라이언트 노출 금지

---

## 4. 데이터베이스 스키마

### 4-1. `push_subscriptions` 테이블 추가

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

### 4-2. 특이사항

- 한 유저가 여러 기기에서 구독 가능 → `(user_id, endpoint)` 유니크
- 브라우저에서 구독 갱신 시 기존 endpoint 재사용되므로 `endpoint UNIQUE`
- `user_agent` 저장해두면 "어느 기기에서 등록" 관리 UI 제공 가능
- `created_at`, `updated_at` 서버에서 직접 주입 (CLAUDE.md 규칙)

---

## 5. 백엔드 구현

### 5-1. 라이브러리 래퍼

**`lib/push/client.ts`** — web-push 싱글톤 초기화
- `webpush.setVapidDetails()` 1회 호출
- VAPID 환경 변수 검증

**`lib/push/send.ts`** — 발송 유틸
- `sendPush(userId, payload)` — 해당 유저의 모든 구독에 발송
- `sendPushToTenant(tenantId, payload)` — 테넌트 전체 발송
- 410 Gone / 404 응답 시 `push_subscriptions`에서 자동 삭제
- 여러 구독 병렬 발송 (`Promise.allSettled`)

### 5-2. API 엔드포인트

**`POST /api/push/subscribe`**
- 요청: `{ endpoint, keys: { p256dh, auth }, userAgent }`
- 세션에서 `userId`, `tenantId` 추출
- `push_subscriptions` upsert (endpoint 기준)
- Zod 스키마로 검증

**`DELETE /api/push/subscribe`**
- 요청: `{ endpoint }`
- 해당 구독만 삭제 (로그아웃 / 알림 끄기 시)

**`GET /api/push/subscriptions`**
- 본인 구독 기기 목록 조회
- 설정 화면에서 "등록된 기기" 표시용

### 5-3. 발송 트리거 지점

| 트리거 | 위치 | 수신자 |
|--------|------|--------|
| 방문 배정 | `PATCH /api/visits/[id]` (user_id 배정 시) | 배정된 직원 |
| 방문 전날 알림 | Cron (일 1회, 19시경) | 다음날 방문 예정 직원 |
| 방문 전 1시간 | Cron (15분 간격) | 곧 방문할 직원 |

---

## 6. 프론트엔드 구현

### 6-1. Service Worker 커스터마이징

`@ducanh2912/next-pwa`는 Workbox 기반이라 `push` 이벤트 기본 미포함.

**`public/sw-custom.js`** 또는 next-pwa 설정의 `customWorkerSrc` 활용:
- `self.addEventListener('push', ...)` — 알림 표시
- `self.addEventListener('notificationclick', ...)` — 클릭 시 해당 페이지로 이동

**`next.config.js`** 의 `next-pwa` 옵션에서 커스텀 worker 병합 설정 필요 — 구현 시 공식 문서 재확인.

### 6-2. 구독 로직

**`lib/push/browser.ts`** — 클라이언트 유틸
- `isPushSupported()` — Notification, ServiceWorker, PushManager 존재 확인
- `getPermissionState()` — granted / denied / default
- `subscribeToPush()` — 권한 요청 → SW 등록 대기 → subscribe → 서버 전송
- `unsubscribeFromPush()` — 구독 해제 + 서버 DELETE

### 6-3. UI 통합

**온보딩 흐름**
- 첫 로그인 후 설정 화면 or 배너로 "알림 허용" 유도
- 권한이 `default`면 배너 표시, `denied`면 숨김

**설정 페이지**
- `/my-info` 또는 `/settings`에 "푸시 알림" 토글 추가
- 현재 권한 상태 표시
- 등록된 기기 목록 + 개별 해제 버튼

**주의**: 권한 요청은 **사용자 액션(클릭)** 직후에만 가능. 페이지 로드 직후 자동 요청은 안 됨.

---

## 7. 알림 페이로드 설계

### 7-1. 페이로드 스키마

```typescript
type PushPayload = {
  title: string;         // "내일 방문 예정 3건"
  body: string;          // "강남 OO식당 외 2곳"
  icon?: string;         // "/icons/icon-192.png"
  badge?: string;        // "/icons/badge-72.png"
  tag?: string;          // 동일 tag는 덮어쓰기
  data: {
    url: string;         // 클릭 시 이동할 경로
    type: NotificationType;
    entityId?: string;
  };
};
```

### 7-2. 알림 타입별 템플릿

| 타입 | 제목 | 본문 | 이동 경로 |
|------|------|------|-----------|
| `visit_assigned` | 새 방문 배정 | "{시설명} — {날짜}" | `/visits/{id}` |
| `visit_tomorrow` | 내일 방문 {n}건 | "{시설명} 외 {n-1}곳" | `/calendar` |
| `visit_upcoming` | 1시간 후 방문 | "{시설명} — {주소}" | `/visits/{id}` |

### 7-3. 페이로드 제약

- 최대 4KB — 긴 내용은 `data.entityId`만 넣고 앱에서 상세 조회
- 암호화되어 전송됨 (VAPID가 자동 처리)

---

## 8. 에러 처리

### 8-1. 구독 만료/무효

web-push 발송 시 응답 코드로 판단:

| 코드 | 의미 | 처리 |
|------|------|------|
| 201 / 200 | 성공 | 로그만 |
| 410 Gone | 구독 영구 만료 | `push_subscriptions` 삭제 |
| 404 Not Found | 엔드포인트 사라짐 | `push_subscriptions` 삭제 |
| 413 Payload Too Large | 4KB 초과 | 페이로드 축소 |
| 429 Too Many Requests | 레이트 리밋 | 재시도 (지수 백오프) |

### 8-2. 구독 갱신

브라우저가 주기적으로 subscription을 갱신할 수 있음. SW의 `pushsubscriptionchange` 이벤트 리스너에서 재구독 후 서버 업데이트.

---

## 9. 플랫폼별 주의사항

### iOS (Safari)

- **iOS 16.4+ 지원** (그 이전 버전은 Web Push 불가)
- **홈 화면에 추가된 PWA에서만 동작** — 일반 Safari 탭에선 알림 권한 요청 자체가 안 뜸
- PWA manifest (`display: standalone`) 필수 — 현재 next-pwa 설정 확인 필요
- 사용자에게 "홈 화면에 추가" 안내 UI 필요

### Android Chrome

- 완전 지원, 제약 없음
- 설치 프롬프트 (A2HS) 유도 가능

### 데스크톱

- Chrome, Edge, Firefox: 완전 지원
- Safari 16+: macOS에서 Web Push 지원

---

## 10. 테스트 전략

### 10-1. 로컬 개발

- `web-push`는 localhost(http)에서 동작 안 함 → 로컬 HTTPS 필요
- Next.js 개발 서버 HTTPS 옵션 또는 ngrok 활용
- Chrome DevTools → Application → Service Workers → Push 버튼으로 수동 트리거 가능

### 10-2. 검증 체크리스트

- [ ] 권한 요청 → 허용 → 구독 DB 저장
- [ ] 권한 거부 시 UI 대응
- [ ] 수동 API 호출로 알림 수신 확인
- [ ] 알림 클릭 → 지정 경로 이동
- [ ] 로그아웃 시 구독 해제
- [ ] 멀티 기기 (PC + 모바일) 동시 수신
- [ ] 구독 만료 시 자동 삭제 (410 테스트)
- [ ] iOS PWA 모드에서 동작 확인

---

## 11. Cron/스케줄 발송

### 옵션

| 방식 | 장점 | 단점 |
|------|------|------|
| **Vercel Cron** | Next.js 네이티브, 설정 간단 | Pro 플랜 유료 |
| **Supabase Edge Functions + pg_cron** | Supabase 스택 일관성 | Deno 런타임, 별도 코드 |
| **외부 cron → API 호출** | 자유도 높음 | 별도 인프라 |

### 권장: Vercel Cron

`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/visit-reminders", "schedule": "0 19 * * *" },
    { "path": "/api/cron/upcoming-visits", "schedule": "*/15 * * * *" }
  ]
}
```

- Cron 엔드포인트는 `CRON_SECRET` 환경 변수로 인증 (외부 호출 차단)

---

## 12. 신규 파일 디렉토리 구조

기존 프로젝트 컨벤션을 따라 아래 파일들이 추가됩니다.

```
pest-control-project/
├── app/
│   ├── api/
│   │   ├── push/
│   │   │   └── subscribe/
│   │   │       └── route.ts              # POST/DELETE - 구독 등록/해제
│   │   └── cron/
│   │       ├── visit-reminders/
│   │       │   └── route.ts              # 방문 전날 알림 (19시)
│   │       └── upcoming-visits/
│   │           └── route.ts              # 1시간 전 알림 (15분 간격)
│   └── (app)/
│       └── my-info/
│           └── page.tsx                  # (기존) 알림 토글 UI 추가
│
├── lib/
│   ├── push/                             # 신규 디렉토리
│   │   ├── client.ts                     # web-push 싱글톤 초기화
│   │   ├── send.ts                       # sendPush / sendPushToTenant 유틸
│   │   ├── browser.ts                    # 클라이언트 유틸 (subscribe/unsubscribe)
│   │   ├── templates.ts                  # 알림 타입별 페이로드 템플릿
│   │   └── types.ts                      # PushPayload, NotificationType 등
│   └── validations/
│       └── push.ts                       # Zod 스키마 (구독 등록 요청 검증)
│
├── components/
│   └── push/                             # 신규 디렉토리
│       ├── push-permission-banner.tsx    # 권한 요청 배너 (최초 로그인 후)
│       └── push-settings.tsx             # 설정 페이지 내 알림 토글
│
├── public/
│   └── sw-custom.js                      # Service Worker push 이벤트 핸들러
│                                          # (next-pwa가 기본 SW에 병합)
│
├── scripts/
│   └── generate-vapid.ts                 # VAPID 키 생성 헬퍼 (1회용)
│
├── reference/
│   └── schema.sql                        # (기존) push_subscriptions 테이블 추가
│
├── .env                                  # (기존) VAPID 키 3개 환경변수 추가
├── next.config.ts                        # (기존) next-pwa customWorkerSrc 설정
└── vercel.json                           # (신규 또는 기존) Cron 스케줄 정의
```

### 파일별 역할 요약

| 파일 | 역할 |
|------|------|
| `app/api/push/subscribe/route.ts` | 구독 CRUD (세션 기반, `requireAuth`) |
| `app/api/cron/*/route.ts` | 스케줄 트리거 진입점, `CRON_SECRET` 검증 |
| `lib/push/client.ts` | `webpush.setVapidDetails()` 초기화, 서버 전용 |
| `lib/push/send.ts` | user_id/tenant_id 기반 발송 래퍼, 410 Gone 시 자동 삭제 |
| `lib/push/browser.ts` | 클라이언트 전용, `isPushSupported()`, `subscribeToPush()` 등 |
| `lib/push/templates.ts` | 알림 타입별 제목/본문/이동경로 생성 |
| `lib/push/types.ts` | 공유 타입 정의 (서버/클라이언트 둘 다 import) |
| `lib/validations/push.ts` | Zod 스키마 (endpoint, keys, userAgent 검증) |
| `components/push/push-permission-banner.tsx` | 대시보드 상단 배너, 권한 `default`일 때만 표시 |
| `components/push/push-settings.tsx` | 설정 페이지 내 토글 + 등록 기기 목록 |
| `public/sw-custom.js` | `push` / `notificationclick` 이벤트 리스너 |
| `scripts/generate-vapid.ts` | `npx tsx scripts/generate-vapid.ts` 로 VAPID 키 1회 생성 |

### 기존 파일 수정 범위

| 파일 | 수정 내용 |
|------|-----------|
| [reference/schema.sql](schema.sql) | `push_subscriptions` 테이블 DDL 추가 |
| [next.config.ts](../next.config.ts) | next-pwa에 커스텀 SW 병합 옵션 추가 |
| [app/api/visits/[id]/route.ts](../app/api/visits/[id]/route.ts) | 배정 변경 시 `sendPush()` 호출 |
| [app/(app)/my-info/page.tsx](../app/(app)/my-info/page.tsx) | `<PushSettings />` 컴포넌트 배치 |
| [app/(app)/dashboard/page.tsx](../app/(app)/dashboard/page.tsx) | `<PushPermissionBanner />` 배치 |
| `.env.local` / `.env.example` | VAPID 관련 3개 환경 변수 추가 |

---

## 13. 구현 단계별 로드맵

### Phase 1: 기반 (하루)
- [ ] VAPID 키 생성 및 환경 변수 세팅
- [ ] `push_subscriptions` 테이블 마이그레이션
- [ ] `web-push` 라이브러리 설치 및 래퍼 작성
- [ ] 구독 관리 API (`POST/DELETE /api/push/subscribe`)

### Phase 2: 클라이언트 (하루)
- [ ] Service Worker push 이벤트 핸들러 추가
- [ ] 브라우저 유틸 (`subscribeToPush`, `unsubscribeFromPush`)
- [ ] 설정 페이지에 알림 토글 UI
- [ ] 로컬 HTTPS 환경에서 수동 테스트

### Phase 3: 이벤트 기반 발송 (하루)
- [ ] 방문 배정 시 즉시 알림 (`PATCH /api/visits/[id]`)
- [ ] 알림 클릭 시 해당 페이지 이동 로직

### Phase 4: Cron 기반 발송 (하루)
- [ ] Vercel Cron 설정
- [ ] 방문 전날 알림 (`/api/cron/visit-reminders`)
- [ ] 방문 1시간 전 알림 (`/api/cron/upcoming-visits`)

### Phase 5: iOS 대응
- [ ] PWA manifest 검증 (`display: standalone`)
- [ ] "홈 화면에 추가" 안내 UI
- [ ] iOS 실기기 테스트

---

## 14. 체크해야 할 기존 코드

- [package.json](../package.json) — `@ducanh2912/next-pwa` 버전 확인
- [next.config.js](../next.config.js) 또는 `next.config.ts` — PWA 설정, 커스텀 SW 옵션
- [public/manifest.json](../public/manifest.json) — PWA manifest 존재 여부
- [app/api](../app/api/) — 세션 기반 인증 패턴 (`requireAuth`)
- [lib/auth/session.ts](../lib/auth/session.ts) — 세션 구조 (userId, tenantId)

---

## 15. 보안 고려사항

- **VAPID Private Key**: `.env.local`에만 존재, `NEXT_PUBLIC_` 접두사 금지
- **구독 정보**: 유저 ID와 tenant_id로 격리, 다른 테넌트 알림 발송 불가
- **Cron 엔드포인트**: `CRON_SECRET` 헤더 검증 필수 (외부 호출 차단)
- **페이로드**: 민감 정보 (전화번호, 주소 등) 최소화, 필요 시 entityId만 전달
- **구독 해제**: 로그아웃 시 해당 기기 구독 자동 삭제 → 이전 사용자 기기에 알림 가지 않도록

---

## 16. 비용

- VAPID / web-push: **0원**
- Vercel Cron: Pro 플랜 $20/월 (다른 Pro 기능과 공유)
- Supabase: 기존 사용량에 포함 (`push_subscriptions` 저장 공간 미미)
- **합계: 거의 추가 비용 없음**

카카오 알림톡 대비 절대적 우위. 단, iOS 일반 Safari 제약으로 **고객 대상 알림은 카카오 알림톡 병행 필요** (P3에서 검토).
