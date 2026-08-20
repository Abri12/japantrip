/**
 * 좌표 판정 — 「정말 거기 있었나」.
 *
 * 리뷰와 기여 확인이 **같은 판정**을 써야 한다. 다르면 같은 위치에서 리뷰는
 * 되고 기여는 안 되는(또는 반대인) 상태가 생기는데, 사용자는 그 이유를
 * 알 방법이 없다.
 *
 * 반경을 오차만큼 넓혀 주는 규칙도 여기서 지킨다. 정확도가 나쁜 기기를
 * 쓴다고 진짜 방문자를 떨어뜨리면 안 된다.
 */

import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GEO, MAX_ACCEPTABLE_ACCURACY_M, checkAt, distanceMeters } from '../geo.mjs';

const PLACE = 'dotonbori';
const { lat, lng, radiusM } = GEO[PLACE];

describe('distanceMeters', () => {
  it('같은 점은 0m', () => {
    strictEqual(distanceMeters(lat, lng, lat, lng), 0);
  });

  it('위도 1도는 약 111km', () => {
    const d = distanceMeters(0, 0, 1, 0);
    ok(Math.abs(d - 111_195) < 500, `${d}m 는 위도 1도와 안 맞아요`);
  });

  it('방향이 바뀌어도 같은 거리', () => {
    strictEqual(distanceMeters(34.66, 135.5, 35.0, 139.7), distanceMeters(35.0, 139.7, 34.66, 135.5));
  });

  it('정수 미터로 준다 — 소수점은 이 판정에서 뜻이 없다', () => {
    strictEqual(Number.isInteger(distanceMeters(34.66, 135.5, 34.67, 135.51)), true);
  });
});

describe('checkAt', () => {
  it('한복판이면 통과', () => {
    const r = checkAt(PLACE, lat, lng, 10);
    strictEqual(r.ok, true);
    strictEqual(r.distanceM, 0);
  });

  it('모르는 장소는 거부하고 이유를 준다', () => {
    strictEqual(checkAt('없는곳', lat, lng, 10).reason, 'unknown-place');
  });

  it('좌표가 없으면 거부한다 — 없는 값을 0으로 읽으면 아프리카 앞바다가 된다', () => {
    strictEqual(checkAt(PLACE, null, null, 10).reason, 'no-location');
    strictEqual(checkAt(PLACE, undefined, undefined, 10).reason, 'no-location');
  });

  it('정확도가 너무 나쁘면 거리 이전에 거부한다', () => {
    const r = checkAt(PLACE, lat, lng, MAX_ACCEPTABLE_ACCURACY_M + 1);
    strictEqual(r.ok, false);
    strictEqual(r.reason, 'accuracy');
    // 거리를 안 준다 — 믿을 수 없는 좌표로 잰 거리는 알려줄 값이 아니다
    strictEqual(r.distanceM, null);
  });

  it('정확도 경계값은 통과한다', () => {
    strictEqual(checkAt(PLACE, lat, lng, MAX_ACCEPTABLE_ACCURACY_M).ok, true);
  });

  it('정확도를 안 보내도 통과할 수 있다', () => {
    strictEqual(checkAt(PLACE, lat, lng, null).ok, true);
    strictEqual(checkAt(PLACE, lat, lng, undefined).ok, true);
  });

  it('반경 밖이면 거부하고 거리를 알려준다', () => {
    // 위도 0.01도 ≈ 1.1km. 어느 장소 반경보다도 멀다.
    const r = checkAt(PLACE, lat + 0.01, lng, 5);
    strictEqual(r.ok, false);
    strictEqual(r.reason, 'too-far');
    ok(r.distanceM > radiusM, '얼마나 멀었는지를 줘야 사용자가 뭘 고칠지 안다');
  });

  it('측정 오차만큼 반경을 넓혀 준다', () => {
    /* 반경 바로 밖에 있지만 기기 오차가 그만큼 있는 경우. 오차가 큰 기기를
       쓴다고 진짜 방문자를 떨어뜨릴 수는 없다. */
    const justOutside = lat + (radiusM + 30) / 111_195;
    strictEqual(checkAt(PLACE, justOutside, lng, 0).ok, false);
    strictEqual(checkAt(PLACE, justOutside, lng, 60).ok, true);
  });
});

describe('기준 좌표', () => {
  it('모든 장소가 좌표와 반경을 갖는다', () => {
    for (const [id, g] of Object.entries(GEO)) {
      ok(Number.isFinite(g.lat), `${id} 위도`);
      ok(Number.isFinite(g.lng), `${id} 경도`);
      ok(g.radiusM > 0, `${id} 반경`);
    }
  });

  it('좌표가 일본 안에 있다', () => {
    for (const [id, g] of Object.entries(GEO)) {
      ok(g.lat > 24 && g.lat < 46, `${id} 위도가 일본 밖(${g.lat})`);
      ok(g.lng > 122 && g.lng < 146, `${id} 경도가 일본 밖(${g.lng})`);
    }
  });
});
