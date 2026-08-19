/**
 * 업스트림 응답을 키별로 캐시한다.
 *
 * 이 서버가 하는 일은 결국 하나다 — **여러 사용자의 같은 질문을 한 번의
 * 외부 호출로 답한다.** 오사카에 있는 사용자 100명이 날씨를 물으면 좌표가
 * 같으므로 답도 같다. 기기가 각자 부르면 100번이고, 여기서 캐시하면 1번이다.
 *
 * 세 가지를 지킨다.
 *
 * **동시 요청을 합친다.** 캐시가 비었을 때 100개가 한꺼번에 들어오면 업스트림
 * 호출도 100번이 된다. 진행 중인 약속을 재사용해 한 번만 부른다.
 *
 * **낡아도 준다.** 업스트림이 죽었을 때 낡은 값이라도 돌려주는 편이 낫다.
 * 환율이 한 시간 낡은 것과 화면에서 사라지는 것은 다른 문제다.
 *
 * **메모리만 쓴다.** 재시작하면 비지만, 전부 몇 분~한 시간이면 다시 받는
 * 공개 데이터라 디스크에 남길 이유가 없다. 상태를 갖는 순간(리뷰·크레딧)
 * 그때 저장소를 고르면 된다.
 */

/** @type {Map<string, {value: unknown, at: number}>} */
const store = new Map();
/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

/**
 * @param {string} key 같은 답을 주는 질문이면 같은 키여야 한다
 * @param {number} ttlMs 이 시간 안에는 업스트림을 다시 부르지 않는다
 * @param {() => Promise<unknown>} load 업스트림 호출
 */
export async function cached(key, ttlMs, load) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return { value: hit.value, fresh: true, ageMs: Date.now() - hit.at };
  }

  let pending = inflight.get(key);
  if (!pending) {
    pending = load().finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }

  try {
    const value = await pending;
    store.set(key, { value, at: Date.now() });
    return { value, fresh: false, ageMs: 0 };
  } catch (err) {
    // 업스트림이 죽었다. 낡은 값이라도 있으면 그걸 준다.
    if (hit) return { value: hit.value, fresh: true, ageMs: Date.now() - hit.at, stale: true };
    throw err;
  }
}

/** 남은 캐시 수명(초). 클라이언트 `cache-control` 에 그대로 쓴다 */
export function secondsLeft(key, ttlMs) {
  const hit = store.get(key);
  if (!hit) return 0;
  return Math.max(0, Math.ceil((hit.at + ttlMs - Date.now()) / 1000));
}

export async function getJson(url) {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}
