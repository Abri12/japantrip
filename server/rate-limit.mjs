/**
 * 요청 제한 — 한 회선이 서버를 통째로 쓰지 못하게.
 *
 * ## 무엇을 막나
 *
 * 셋이다. 셋의 무게가 달라서 한 잣대로 재면 안 된다.
 *
 *   ① **사고** — 앱 버그로 같은 요청이 반복된다. 악의는 없는데 서버가 죽는다.
 *   ② **값싼 어뷰징** — 제보·리뷰를 기계로 쏟아붓는다. 여기가 뚫리면 데이터가
 *      쓰레기가 되고, 크레딧을 켠 뒤에는 돈이 샌다.
 *   ③ **자원** — 읽기는 캐시가 막아 주지만 CPU 와 대역폭은 그대로 나간다.
 *
 * ## IP 를 어떻게 다루나 — 여기가 이 파일에서 제일 중요한 결정이다
 *
 * 이 앱에는 **원본 IP 를 저장하지 않는다**는 규칙이 있다. 담합 판정은 그래서
 * 대역(/24)까지만 잘라 해시한다(`anti-collusion.mjs`).
 *
 * 그런데 그 굵기로 요청을 제한하면 **정상 사용자가 먼저 다친다.** 일본 통신사는
 * CGNAT 를 크게 써서 여행자 수백 명이 같은 /24 로 보이고, 호텔·공항 와이파이도
 * 마찬가지다. 한 명이 많이 쓰면 같은 대역의 모두가 막힌다.
 *
 * 그래서 여기서는 **IP 전체를 해시해서 쓴다.** 저장 규칙과 어긋나지 않는 이유는
 * 하나다 — **어디에도 저장하지 않는다.** 메모리에만 있고, 몇 분 뒤에 지워지고,
 * 서버를 재시작하면 사라진다. 파일로도 로그로도 나가지 않는다.
 *
 * 「저장하지 않는다」와 「구분하지 않는다」는 다른 요구다. 앞은 지켜야 할
 * 약속이고 뒤는 그 약속이 요구하지 않는 것이다.
 *
 * ## 왜 라우트마다 안 붙이나
 *
 * 라우트가 스물다섯 개다. 한 줄씩 붙이면 새 라우트를 더할 때 빠뜨리고, 빠뜨린
 * 자리가 곧 구멍이 된다. **입구 한 곳**에서 경로를 보고 정하게 한다.
 *
 * ## 메모리는 유한하다
 *
 * 키마다 값 하나(`{tokens, at}`)만 들고, 개수에 상한을 둔다. 상한을 넘으면
 * 오래된 것부터 버린다 — IP 를 바꿔 가며 두드려도 메모리가 무한히 늘지 않는다.
 */

import { createHash } from 'node:crypto';

/** IP 를 가리는 소금. 담합 판정과 같은 값을 쓸 이유가 없어 따로 둔다 */
const SALT = process.env.RATE_LIMIT_SALT ?? 'japantrip-rate-salt';

/**
 * 무리별 예산 — **분당 몇 번**과 **한 번에 몰아 쓸 수 있는 양**.
 *
 * 토큰 버킷이다. 초당 `perMinute/60` 개씩 차오르고, 최대 `burst` 개까지 고인다.
 * 고정 창(1분에 N번)과 달리 경계에서 두 배가 몰리는 일이 없고, 잠깐의 연속
 * 요청(화면 하나가 API 를 서너 개 부르는 것)은 그대로 통과한다.
 */
const BUDGETS = {
  /** 읽기 — 캐시가 받쳐 주므로 넉넉히. 화면 하나가 여러 개를 동시에 부른다 */
  read: { perMinute: 120, burst: 40 },

  /** 쓰기 — 사람이 손으로 하는 일이다. 분당 열 번을 넘길 이유가 없다 */
  write: { perMinute: 10, burst: 5 },

  /**
   * 크래시 보고 — 앱이 죽는 중이라 몰려 온다.
   *
   * 앱 쪽에도 1분 중복 억제와 실행당 20건 상한이 있지만(`lib/error-report.ts`),
   * 그건 우리 앱만 지키는 규칙이다. 주소를 아는 누구나 부를 수 있으므로
   * 서버에서도 막는다.
   */
  errors: { perMinute: 30, burst: 10 },
};

/** 들고 있을 키의 최대 개수. 넘으면 오래된 것부터 버린다 */
const MAX_KEYS = Number(process.env.RATE_LIMIT_MAX_KEYS ?? 10_000);

/** 이 시간 동안 조용하면 잊는다 */
const IDLE_MS = 10 * 60_000;

/** @type {Map<string, {tokens: number, at: number}>} */
const buckets = new Map();

/**
 * 이 요청이 어느 무리인가.
 *
 * 관리자 경로는 토큰으로 막혀 있어 여기서 세지 않는다 — 운영자가 목록을
 * 훑다가 자기 서버에 막히면 그게 더 나쁘다.
 *
 * @returns 무리 이름, 또는 제한하지 않을 때 null
 */
export function budgetFor(pathname, method) {
  if (pathname.startsWith('/api/admin/')) return null;
  if (pathname === '/health') return null;
  if (pathname === '/api/errors') return 'errors';
  return method === 'POST' ? 'write' : 'read';
}

/** 회선을 가리는 값. 원본 IP 는 남기지 않는다 */
function keyOf(ip, budget) {
  const hashed = createHash('sha256').update(SALT).update(String(ip ?? '')).digest('hex').slice(0, 16);
  // 무리마다 예산이 다르므로 통도 따로 둔다. 읽기를 많이 했다고 제보가 막히면 안 된다.
  return `${budget}:${hashed}`;
}

/** 오래 조용한 것부터 버린다 */
function evict() {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (now - b.at > IDLE_MS) buckets.delete(key);
  }
  if (buckets.size <= MAX_KEYS) return;
  /* 그래도 넘치면 **가장 오래된 것부터** 버린다. Map 은 넣은 순서를 지키므로
     앞에서부터 지우면 된다. 활동 중인 회선은 아래에서 다시 만들어지므로,
     최악의 경우에도 「막혀야 할 사람이 잠깐 안 막히는」 쪽으로 어긋난다. */
  const over = buckets.size - MAX_KEYS;
  let i = 0;
  for (const key of buckets.keys()) {
    if (i++ >= over) break;
    buckets.delete(key);
  }
}

/**
 * 이 요청을 받아도 되나.
 *
 * @returns `{ ok: true }` 또는 `{ ok: false, retryAfter }` (초)
 */
export function take(ip, pathname, method) {
  const budget = budgetFor(pathname, method);
  if (!budget) return { ok: true };

  const { perMinute, burst } = BUDGETS[budget];
  const key = keyOf(ip, budget);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_KEYS) evict();
    bucket = { tokens: burst, at: now };
    buckets.set(key, bucket);
  } else {
    // 지난 시간만큼 채운다. 가득 차면 더 안 고인다.
    const refilled = ((now - bucket.at) / 60_000) * perMinute;
    bucket.tokens = Math.min(burst, bucket.tokens + refilled);
    bucket.at = now;
  }

  if (bucket.tokens < 1) {
    // 한 개가 차오르기까지 몇 초 남았나. 「잠시 뒤」보다 정확한 답을 준다.
    const seconds = Math.ceil(((1 - bucket.tokens) / perMinute) * 60);
    return { ok: false, retryAfter: Math.max(1, seconds) };
  }

  bucket.tokens -= 1;
  return { ok: true };
}

/** 지금 몇 개를 들고 있나 — /health 에 얹어 새는지 본다 */
export function size() {
  return buckets.size;
}

/** 테스트용 — 통을 비운다 */
export function reset() {
  buckets.clear();
}
