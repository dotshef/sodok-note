# 세션 접근 가이드

## requireAuth()의 정체

```
requireAuth()
  → getSession()
    → cookies()에서 "session" 쿠키 읽기 (next/headers — 서버 전용)
    → jose의 jwtVerify()로 JWT 검증
    → JwtPayload { userId, tenantId, role, email } 반환
  → null이면 /login으로 redirect
  → 유효하면 JwtPayload 반환
```

서버 프로세스 내에서 쿠키를 직접 읽고 JWT를 디코딩한다. 네트워크 요청 없이 ~1ms에 완료. `cookies()`가 서버 전용이라 클라이언트 컴포넌트에서는 호출 불가.

## 세션 접근 방식 비교

인증 정보를 가져오는 방법은 크게 4가지:

| 방식 | 원리 | 네트워크 | 속도 |
|---|---|---|---|
| **requireAuth()** | 서버에서 쿠키 직접 읽기 + JWT 검증 | 없음 | ~1ms |
| **/api/auth/me** | 위와 동일한 로직을 HTTP 엔드포인트로 감싼 것 | fetch 1회 | ~50-200ms |
| **SessionContext** | layout이 requireAuth()로 얻은 결과를 React Context로 전달 | 없음 | 0ms (이미 메모리에 있음) |
| **Server Action** | 서버 함수를 클라이언트에서 RPC로 호출 | 내부 POST 1회 | ~30-100ms |

### requireAuth()
- **실행 위치**: 서버 컴포넌트, API 라우트
- **장점**: 가장 빠름, 가장 직접적
- **단점**: 클라이언트 컴포넌트에서 호출 불가
- **인증 실패 처리**: 서버에서 redirect

### /api/auth/me
- **실행 위치**: 클라이언트에서 fetch로 호출
- **장점**: 클라이언트에서 사용 가능, 외부 서비스에서도 호출 가능
- **단점**: HTTP round-trip 비용, 이미 서버에서 갖고 있는 데이터를 다시 요청하는 낭비
- **인증 실패 처리**: 401 응답 → 클라이언트에서 처리
- **본질**: requireAuth()를 HTTP로 감싼 래퍼

### SessionContext (useSession)
- **실행 위치**: 클라이언트 컴포넌트
- **장점**: 추가 요청 0, 즉시 접근, layout이 이미 검증한 결과를 재사용
- **단점**: 서버 컴포넌트에서 useContext 사용 불가. layout 하위에서만 동작
- **인증 실패 처리**: layout의 requireAuth()가 이미 처리했으므로 불필요
- **본질**: 서버 → 클라이언트로 데이터를 넘기는 다리

### Server Action
- **실행 위치**: 클라이언트에서 호출하지만 서버에서 실행
- **장점**: API 라우트를 만들지 않고 서버 함수를 호출 가능
- **단점**: 세션 읽기만을 위해 쓰기엔 과잉 (Server Action은 mutation 용도에 적합)
- **참고**: 이 프로젝트에서는 미사용

## 2×2 조합

### 축

- **데이터 소스**: requireAuth() vs /api/auth/me vs SessionContext vs Server Action
- **컴포넌트 타입**: 서버 컴포넌트 vs 클라이언트 컴포넌트

### 조합표

| | 서버 컴포넌트 | 클라이언트 컴포넌트 |
|---|---|---|
| **requireAuth()** | ✅ 최적 | ❌ 불가 (cookies()가 서버 전용) |
| **/api/auth/me** | ⚠️ 가능하지만 무의미 (requireAuth가 우월) | ✅ 가능, 단 불필요한 네트워크 비용 |
| **SessionContext** | ❌ 불가 (useContext는 클라이언트 훅) | ✅ 최적 |
| **Server Action** | ❌ 서버 컴포넌트에선 직접 await하면 됨 | ⚠️ 가능하지만 읽기 전용엔 과잉 |

### 조합 1: 서버 컴포넌트 + requireAuth() ✅ 최적

```tsx
export default async function SomePage() {
  const session = await requireAuth();
  return <div>{session.role}</div>;
}
```

서버에서 쿠키를 직접 읽으므로 가장 빠르고 단순하다. 서버 컴포넌트에서 세션이 필요하면 이것만 쓰면 된다.

### 조합 2: 서버 컴포넌트 + /api/auth/me ⚠️ 무의미

```tsx
export default async function SomePage() {
  const res = await fetch("http://localhost:3000/api/auth/me");
  const session = await res.json();
  return <div>{session.role}</div>;
}
```

서버에서 자기 자신의 API를 HTTP로 호출하는 것. requireAuth()로 직접 읽으면 되는데 굳이 네트워크를 태울 이유가 없다.

### 조합 3: 클라이언트 컴포넌트 + /api/auth/me ⚠️ 차선책

```tsx
"use client";
import { useEffect, useState } from "react";

export default function SomePage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!ignore) setRole(data.role);
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (!role) return <div>로딩...</div>;
  return <div>{role}</div>;
}
```

동작은 하지만:
- 매 페이지 진입 시 HTTP 요청 1회 발생
- 응답 올 때까지 로딩 상태 필요
- layout이 이미 requireAuth()로 같은 데이터를 갖고 있는데 다시 요청하는 구조

layout 하위라면 SessionContext가 이것의 **상위 호환**이다.

### 조합 4: 클라이언트 컴포넌트 + SessionContext ✅ 최적

```tsx
"use client";
import { useSession } from "@/components/providers/session-provider";

export default function SomePage() {
  const { role, email } = useSession();
  return <div>{role === "admin" && <AdminPanel />}</div>;
}
```

layout이 requireAuth()로 한 번 검증한 결과가 Context를 통해 즉시 전달된다. 추가 네트워크 요청 0, 로딩 상태 불필요, 가장 깔끔하다.

### 조합 5: 클라이언트 컴포넌트 + Server Action ⚠️ 과잉

```tsx
"use client";
// server action 정의 (별도 파일)
"use server";
export async function getMySession() {
  const session = await getSession();
  return session;
}

// 클라이언트에서 호출
import { getMySession } from "./actions";

export default function SomePage() {
  useEffect(() => {
    getMySession().then(setSession);
  }, []);
}
```

/api/auth/me와 비슷한 구조를 Server Action으로 구현한 것. API 라우트 파일을 안 만들어도 된다는 장점은 있지만, 읽기 전용 데이터 조회에 Server Action은 과한 도구다. SessionContext가 이미 해결한 문제를 복잡하게 다시 해결하는 셈.

## /api/auth/me가 정당화되는 경우

SessionContext가 있는 이 프로젝트에서 /api/auth/me가 필요한 경우는 **layout 바깥**에서 세션이 필요할 때뿐이다:

- 외부 서비스/웹훅이 현재 로그인 사용자 정보를 확인할 때
- PWA 서비스 워커에서 세션 유효성을 체크할 때
- layout의 SessionProvider 범위 밖의 페이지 (예: /login에서 "이미 로그인됨" 체크)

현재 이 프로젝트에는 해당 케이스가 없으므로 /api/auth/me는 불필요.

## 이 프로젝트의 최종 구조

```
layout.tsx (서버)
  ├─ requireAuth() → session 획득 (1회, 유일한 JWT 검증 지점)
  └─ <SessionProvider session={session}>
       └─ 모든 자식 페이지 (클라이언트)
            └─ useSession() → { role, email, userId, tenantId }
```

| 상황 | 사용할 것 |
|---|---|
| 클라이언트 페이지에서 session 필요 | `useSession()` |
| 서버 컴포넌트에서 session 필요 | `await requireAuth()` |
| API 라우트에서 session 필요 | `await getSession()` + null 체크 |
| 인증 게이트 (미인증 → redirect) | layout의 `requireAuth()` (이미 처리됨) |
