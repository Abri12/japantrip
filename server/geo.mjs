/**
 * 좌표 판정 — 「정말 거기 있었나」.
 *
 * 리뷰가 쓰던 것을 꺼내 공용으로 만든다. 기여 확인에도 같은 판정이 필요해서다.
 *
 * 기준 좌표는 **서버가 가진 값**을 쓴다(`places-geo.json`). 클라이언트가 보낸
 * 좌표로 클라이언트가 판정하면, 앱을 거치지 않고 API 를 직접 부르는 것만으로
 * 인증을 만들 수 있다.
 *
 * 이걸로 막지 못하는 것은 모의 위치 앱이다. 판정 위치를 서버로 옮기는 것은
 * *API 우회*를 막는 것이지 *위치 위조*를 막는 게 아니다 — 둘은 다른 문제고,
 * 뒤쪽은 이동 속도 검사(reviews.mjs)와 이상 패턴 탐지로 따로 다룬다.
 */

import { readFileSync } from 'node:fs';

/** 판정의 기준이 되는 장소 좌표 (scripts/gen-places-geo.mjs 가 만든다) */
export const GEO = JSON.parse(readFileSync(new URL('./places-geo.json', import.meta.url), 'utf8'));

/** 앱과 같은 값을 쓴다 — 다르면 앱은 통과인데 서버는 거부하는 상태가 된다 */
export const MAX_ACCEPTABLE_ACCURACY_M = 65;

/** 두 좌표 사이 거리(m). 앱의 distanceMeters 와 같은 Haversine 이다 */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/**
 * 이 좌표가 그 장소 안인가.
 *
 * @returns `{ ok, reason, distanceM }` — 거부해도 이유를 준다. 「안 됩니다」만
 *   돌려주면 사용자가 무엇을 고쳐야 하는지 모른다.
 */
export function checkAt(placeId, lat, lng, accuracyM) {
  const geo = GEO[placeId];
  if (!geo) return { ok: false, reason: 'unknown-place', distanceM: null };

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { ok: false, reason: 'no-location', distanceM: null };
  }

  if (accuracyM !== null && accuracyM !== undefined && accuracyM > MAX_ACCEPTABLE_ACCURACY_M) {
    return { ok: false, reason: 'accuracy', distanceM: null };
  }

  const distanceM = distanceMeters(lat, lng, geo.lat, geo.lng);
  // 측정 오차만큼 반경을 넓혀 준다. 오차가 큰 기기를 쓴다고 못 쓰게 할 수는 없다.
  const effective = geo.radiusM + (accuracyM ?? 0);
  if (distanceM > effective) return { ok: false, reason: 'too-far', distanceM };

  return { ok: true, reason: null, distanceM };
}
