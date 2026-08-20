/**
 * 인증 리뷰 — 판정을 서버가 다시 한다는 성질.
 *
 * 이 파일이 지키는 것은 셋이다.
 *
 *   ① 좌표가 저장되지 않는다. 리뷰마다 위치가 남으면 그건 리뷰 데이터베이스가
 *      아니라 **이동 경로 데이터베이스**다.
 *   ② 장소 판정이 `geo.mjs` 와 같다. 리뷰가 자기 사본을 들고 있던 시절에
 *      이미 한 군데가 갈라져 있었다.
 *   ③ 이동 속도 검사가 실제로 걸린다. 좌표를 찍어 여러 장소를 훑는 가장 흔한
 *      수법을 잡는 유일한 장치다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GEO, MAX_ACCEPTABLE_ACCURACY_M } from '../geo.mjs';
import { freshReviews } from './helpers.mjs';

const PLACE = 'dotonbori';
const { lat, lng, radiusM } = GEO[PLACE];

/** 도톤보리에서 아주 먼 장소 (홋카이도쯤) */
const [FAR_ID, FAR] = Object.entries(GEO).find(([, g]) => Math.abs(g.lat - lat) > 5);

const at = (R, over = {}) =>
  R.create({
    placeId: PLACE,
    rating: 5,
    text: '좋아요',
    lat,
    lng,
    accuracyM: 10,
    authorId: 'u1',
    ...over,
  });

const atFar = (R, authorId) =>
  R.create({
    placeId: FAR_ID,
    rating: 5,
    text: 'ok',
    lat: FAR.lat,
    lng: FAR.lng,
    accuracyM: 10,
    authorId,
  });

describe('입력 검사', () => {
  it('모르는 장소는 거부', async () => {
    const R = await freshReviews();
    strictEqual((await at(R, { placeId: '없는곳' })).error, 'unknown-place');
  });

  it('별점 범위 밖은 거부', async () => {
    const R = await freshReviews();
    strictEqual((await at(R, { rating: 0 })).error, 'rating');
    strictEqual((await at(R, { rating: 6 })).error, 'rating');
    strictEqual((await at(R, { rating: 3.5 })).error, 'rating');
  });

  it('너무 긴 본문은 거부', async () => {
    const R = await freshReviews();
    strictEqual((await at(R, { text: 'ㅋ'.repeat(501) })).error, 'text');
  });

  it('작성자가 없으면 거부', async () => {
    const R = await freshReviews();
    strictEqual((await at(R, { authorId: '' })).error, 'author');
  });
});

describe('현장 판정 — geo 와 같은 규칙', () => {
  it('한복판이면 남길 수 있다', async () => {
    const R = await freshReviews();
    const res = await at(R);
    ok(res.review, JSON.stringify(res));
    strictEqual(res.review.verified, true);
  });

  it('반경 밖이면 거부하고 거리를 준다', async () => {
    const R = await freshReviews();
    const res = await at(R, { lat: lat + 0.01 });
    strictEqual(res.error, 'too-far');
    ok(res.distanceM > radiusM, '얼마나 멀었는지를 줘야 뭘 고칠지 안다');
  });

  it('정확도가 나쁘면 거부', async () => {
    const R = await freshReviews();
    strictEqual((await at(R, { accuracyM: MAX_ACCEPTABLE_ACCURACY_M + 1 })).error, 'accuracy');
  });

  it('오차만큼 반경을 넓혀 준다', async () => {
    const justOutside = lat + (radiusM + 30) / 111_195;
    const R1 = await freshReviews();
    strictEqual((await at(R1, { lat: justOutside, accuracyM: 0 })).error, 'too-far');
    const R2 = await freshReviews();
    ok((await at(R2, { lat: justOutside, accuracyM: 60 })).review);
  });

  it('좌표가 없으면 「멀다」가 아니라 「위치가 없다」라고 한다', async () => {
    /* 사본을 들고 있던 시절에는 null 로 거리를 계산해서 too-far 가 나갔다.
       사용자에게 「안으로 들어가서 다시」라고 말하게 되는데, 들어가도 안 된다. */
    const R = await freshReviews();
    strictEqual((await at(R, { lat: null, lng: null })).error, 'no-location');
  });
});

describe('좌표를 저장하지 않는다', () => {
  it('저장된 리뷰에도, 목록으로 나갈 때도 위도·경도가 없다', async () => {
    const R = await freshReviews();
    const res = await at(R);
    ok(res.review);
    ok(!('lat' in res.review) && !('lng' in res.review), '좌표가 남았어요');
    // 거리는 남는다 — 「얼마나 가까이서 썼나」는 신뢰도 표시에 쓰인다
    strictEqual(typeof res.review.distanceM, 'number');

    for (const r of await R.listFor(PLACE, 'u1')) {
      ok(!('lat' in r) && !('lng' in r), '목록에 좌표가 남았어요');
    }
  });
});

describe('한 사람 한 장소 한 번', () => {
  it('같은 장소에 두 번은 못 쓴다', async () => {
    const R = await freshReviews();
    ok((await at(R)).review);
    strictEqual((await at(R)).error, 'duplicate');
  });

  it('다른 장소에는 쓸 수 있다', async () => {
    /* 이동 속도 검사에 걸리지 않게 직전 인증을 한 시간 전으로 심어 둔다.
       실제로는 걸어가는 시간이 그 간격을 만든다. */
    const R = await freshReviews({ u1: { lat, lng, at: Date.now() - 3600_000 } });
    const g = GEO.kuromon;
    const res = await R.create({
      placeId: 'kuromon',
      rating: 4,
      text: 'ok',
      lat: g.lat,
      lng: g.lng,
      accuracyM: 10,
      authorId: 'u1',
    });
    ok(res.review, JSON.stringify(res));
  });
});

describe('이동 속도', () => {
  it('오사카에서 인증하고 곧바로 홋카이도면 거부', async () => {
    const R = await freshReviews();
    ok((await at(R)).review);
    strictEqual((await atFar(R, 'u1')).error, 'impossible-move');
  });

  it('같은 밀리초에 들어와도 검사를 건너뛰지 않는다', async () => {
    /* 예전에는 「흐른 시간 > 0」일 때만 검사해서, 같은 밀리초에 들어온 두
       요청이 통째로 지나갔다. 0으로 나누는 것을 피하려던 조건이 하필 가장
       의심스러운 경우를 열어 두고 있었다. */
    const R = await freshReviews({ u1: { lat, lng, at: Date.now() } });
    strictEqual((await atFar(R, 'u1')).error, 'impossible-move');
  });

  it('충분히 시간이 지났으면 통과한다 — 비행기로 갈 수 있는 거리다', async () => {
    const R = await freshReviews({ u1: { lat, lng, at: Date.now() - 6 * 3600_000 } });
    ok((await atFar(R, 'u1')).review);
  });

  it('직전 인증이 없으면 검사할 것이 없다', async () => {
    const R = await freshReviews();
    ok((await atFar(R, 'newcomer')).review);
  });
});

describe('신고 — 남의 글을 지우는 도구가 되면 안 된다', () => {
  /** 리뷰 하나를 만들고 그 id 를 준다 */
  async function seed(R, authorId = 'writer') {
    const res = await at(R, { authorId });
    return res.review.id;
  }

  it('신고하면 접수된다', async () => {
    const R = await freshReviews();
    const id = await seed(R);
    const res = await R.report(id, 'reader', 'spam');
    strictEqual(res.ok, true);
    strictEqual(res.duplicated, false);
  });

  it('같은 사람이 여러 번 눌러도 한 번으로 센다', async () => {
    /* 안 그러면 혼자서 문턱을 넘길 수 있어, 신고가 남의 글을 지우는
       도구가 된다. */
    const R = await freshReviews();
    const id = await seed(R);
    for (let i = 0; i < 10; i++) await R.report(id, 'reader', 'spam');

    // 한 명뿐이므로 아직 안 감춰져야 한다
    const list = await R.listFor(PLACE, 'someone-else');
    strictEqual(list.length, 1, '한 사람의 반복 신고로 감춰졌어요');
  });

  it('두 번째 신고는 「이미 했다」고 알린다 — 실패로 말하면 또 누른다', async () => {
    const R = await freshReviews();
    const id = await seed(R);
    await R.report(id, 'reader', 'spam');
    const again = await R.report(id, 'reader', 'spam');
    strictEqual(again.ok, true);
    strictEqual(again.duplicated, true);
  });

  it('자기 글은 신고가 아니라 삭제다', async () => {
    const R = await freshReviews();
    const id = await seed(R, 'me');
    strictEqual((await R.report(id, 'me', 'spam')).error, 'own-review');
  });

  it('없는 리뷰·신고자 없음은 거부한다', async () => {
    const R = await freshReviews();
    const id = await seed(R);
    strictEqual((await R.report('없는id', 'reader', 'spam')).error, 'not-found');
    strictEqual((await R.report(id, '', 'spam')).error, 'reporter');
  });

  it('세 사람이 신고하면 남에게 안 보인다', async () => {
    const R = await freshReviews();
    const id = await seed(R);
    for (const who of ['a', 'b', 'c']) await R.report(id, who, 'offensive');

    strictEqual((await R.listFor(PLACE, 'stranger')).length, 0, '감춰지지 않았어요');
  });

  it('감춰져도 쓴 사람에게는 보이고, 그 사실을 알려준다', async () => {
    /* 조용히 사라지면 앱이 먹은 줄 알고 같은 글을 다시 쓴다. 그러면 신고도
       다시 쌓이고 아무도 이유를 모른 채 반복된다. */
    const R = await freshReviews();
    const id = await seed(R, 'writer');
    for (const who of ['a', 'b', 'c']) await R.report(id, who, 'offensive');

    const mine = await R.listFor(PLACE, 'writer');
    strictEqual(mine.length, 1);
    strictEqual(mine[0].hidden, true);
  });

  it('감춰진 리뷰는 평점에서도 빠진다', async () => {
    /* 목록에서만 감추면 별점은 그대로 끌려 내려간 채라, 신고가 반쯤만 듣는다. */
    const R = await freshReviews();
    const bad = await seed(R, 'spammer');
    await R.create({
      placeId: PLACE,
      rating: 5,
      text: '좋아요',
      lat,
      lng,
      accuracyM: 10,
      authorId: 'honest',
    });

    strictEqual((await R.summary([PLACE]))[PLACE].count, 2);
    for (const who of ['a', 'b', 'c']) await R.report(bad, who, 'spam');
    strictEqual((await R.summary([PLACE]))[PLACE].count, 1, '평점에 그대로 남았어요');
  });

  it('신고자와 신고 수는 밖으로 안 나간다', async () => {
    /* 「신고 2건」이 보이면 한 명만 더 붙이면 감춰진다는 걸 알게 되고,
       그게 곧 사용법이 된다. */
    const R = await freshReviews();
    const id = await seed(R);
    await R.report(id, 'reader', 'spam');

    const [row] = await R.listFor(PLACE, 'stranger');
    ok(!('reports' in row), '신고 내역이 새어 나갔어요');
    ok(!('reportCount' in row), '신고 수가 새어 나갔어요');
  });
});

describe('운영자 검토', () => {
  it('신고된 리뷰를 모아 보되 신고자는 안 준다', async () => {
    const R = await freshReviews();
    const res = await at(R, { authorId: 'writer' });
    await R.report(res.review.id, 'reader', 'offensive');

    const [row] = await R.listReported();
    strictEqual(row.reportCount, 1);
    strictEqual(row.reasons[0], 'offensive');
    // 운영자에게도 누가 신고했는지는 안 준다. 몇 건이고 무슨 사유인지면 된다.
    ok(!('reports' in row));
    ok(!('authorId' in row));
  });

  it('「문제 없음」으로 판단하면 다시 보이게 할 수 있다', async () => {
    const R = await freshReviews();
    const res = await at(R, { authorId: 'writer' });
    for (const who of ['a', 'b', 'c']) await R.report(res.review.id, who, 'spam');
    strictEqual((await R.listFor(PLACE, 'stranger')).length, 0);

    strictEqual((await R.clearReports(res.review.id)).ok, true);
    strictEqual((await R.listFor(PLACE, 'stranger')).length, 1, '되살아나지 않았어요');
  });
});
