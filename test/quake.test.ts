/**
 * 밖에서 오는 지진 데이터가 **모양이 어긋나도 화면이 죽지 않아야 한다.**
 *
 * 실제로 죽은 적이 있다. 긴급지진속보에 `areas` 가 없이 왔고,
 * `for (const area of event.areas)` 가 `event.areas is not iterable` 로
 * 터지면서 화면 전체가 오류 화면이 됐다. 하필 안전 기능이라 더 나쁘다 —
 * 지진이 났을 때 쓰라고 만든 화면이 지진이 났을 때 죽는다.
 *
 * 타입 검사기는 이걸 못 잡는다. `get<T>()` 가 `as T` 로 캐스팅하기 때문에
 * **컴파일러는 API 를 무조건 믿는다.** 그러니 시험으로 잡아야 한다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { eewScaleForPrefecture, fetchEew, fetchQuakes } from '@/lib/quake';

/** 원하는 응답을 돌려주는 가짜 서버를 잠시 끼워 넣는다 */
async function withResponse<T>(body: unknown, run: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
  try {
    return await run();
  } finally {
    globalThis.fetch = real;
  }
}

describe('지진 데이터 — 모양이 어긋나도 버틴다', () => {
  it('긴급지진속보에 areas 가 없어도 빈 배열이 된다', async () => {
    /* 실제로 화면을 죽인 응답이다. areas 키가 통째로 없다. */
    const [event] = await withResponse(
      [{ id: 'x', code: 556, time: '2026/08/20 12:00:00', cancelled: false }],
      () => fetchEew(),
    );

    ok(Array.isArray(event.areas), 'areas 가 배열이 아니에요 — 순회하면 죽어요');
    strictEqual(event.areas.length, 0);

    // 실제로 순회하는 코드가 통과하는지까지 본다
    strictEqual(eewScaleForPrefecture(event, '大阪府'), null);
  });

  it('areas 가 배열이 아닌 값으로 와도 버틴다', async () => {
    const [event] = await withResponse([{ id: 'x', code: 556, areas: null }], () => fetchEew());
    strictEqual(event.areas.length, 0);
  });

  it('지진정보에 points 가 없어도 빈 배열이 된다', async () => {
    /* 「내 지역에 영향이 있었나」를 points 로 판정한다. 없으면 같은 이유로 죽는다. */
    const [quake] = await withResponse([{ id: 'y', code: 551 }], () => fetchQuakes());
    ok(Array.isArray(quake.points), 'points 가 배열이 아니에요');
    strictEqual(quake.points.some((p) => p.pref === '大阪府'), false);
  });

  it('목록 자체가 배열이 아니어도 빈 목록으로 돌려준다', async () => {
    /* 서버가 오류를 200 과 함께 객체로 돌려주는 일이 있다. 그때
       `.map` 이 없다고 죽으면 안 된다. */
    strictEqual((await fetchEew()).length >= 0, true);
    strictEqual((await withResponse({ error: 'nope' }, () => fetchEew())).length, 0);
    strictEqual((await withResponse(null, () => fetchQuakes())).length, 0);
  });

  it('정상 응답은 그대로 지나간다', async () => {
    const [event] = await withResponse(
      [
        {
          id: 'z',
          code: 556,
          areas: [
            { pref: '大阪', name: '大阪府北部', scaleFrom: 40, scaleTo: 50, arrivalTime: '' },
            { pref: '京都', name: '京都府南部', scaleFrom: 30, scaleTo: 40, arrivalTime: '' },
          ],
        },
      ],
      () => fetchEew(),
    );

    strictEqual(event.areas.length, 2);
    // 「大阪」와 「大阪府」가 같은 곳으로 이어지는지도 함께 본다
    strictEqual(eewScaleForPrefecture(event, '大阪府'), 50);
    strictEqual(eewScaleForPrefecture(event, '東京都'), null);
  });
});
