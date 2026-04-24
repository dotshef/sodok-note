# React 훅 규칙 (reference)

데이터 페칭 useEffect 작성 시 참조.

## useEffect 내 데이터 페칭

### 금지
- effect 본문에서 동기적 setState 절대 금지 (`setLoading(true)`, `setData(null)` 등)
- `useCallback` + `useEffect` 조합 금지

### 필수
- effect 내부에 async 함수 직접 정의
- `ignore` 플래그로 race condition 방지 (cleanup에서 `ignore = true`)
- `ignore` 체크 후에만 setState 호출
- `loading` 상태는 별도 state 대신 데이터에서 파생 (`!data`, `data === null`)
- 로딩 전환이 필요하면 **이벤트 핸들러**에서 `setData(null)` (effect가 아닌 곳)

### 올바른 패턴: 일회성 fetch (deps 변경 없음)
```tsx
const [data, setData] = useState<Data | null>(null);
const loading = !data;

useEffect(() => {
  let ignore = false;

  async function load() {
    const res = await fetch(url);
    const json = await res.json();
    if (!ignore) setData(json);
  }

  load();
  return () => { ignore = true; };
}, []);
```

### 올바른 패턴: 검색/필터/페이지네이션 (deps 변경 있음)
```tsx
const [data, setData] = useState<Data | null>(null);
const loading = !data;

// effect: 비동기 응답 처리만
useEffect(() => {
  let ignore = false;

  async function fetchData() {
    const res = await fetch(`/api/items?q=${search}&page=${page}`);
    const json = await res.json();
    if (!ignore) setData(json);
  }

  fetchData();
  return () => { ignore = true; };
}, [search, page]);

// 이벤트 핸들러: 로딩 전환은 여기서
<input onChange={(e) => {
  setSearch(e.target.value);
  setData(null); // 로딩 상태 진입
}} />
```

### 올바른 패턴: edit 폼 (초기 데이터 로드)
```tsx
const [loaded, setLoaded] = useState(false);
const [form, setForm] = useState({ name: "", ... });

useEffect(() => {
  let ignore = false;

  async function load() {
    const res = await fetch(url);
    const data = await res.json();
    if (!ignore) {
      setForm({ name: data.name, ... });
      setLoaded(true);
    }
  }

  load();
  return () => { ignore = true; };
}, [id]);
```
