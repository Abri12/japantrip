/**
 * 맛집·관광지 데이터.
 *
 * 두 가지를 반드시 함께 담는다:
 *
 * 1. **좌표와 인증 반경** — 현장 GPS 인증 리뷰의 기준이 된다. (lib/reviews.ts)
 * 2. **가장 가까운 역과 노선** — 관광지 정보가 교통 정보와 끊기면 쓸모가 반으로
 *    준다. "거기 좋아요"까지만 알려주고 어떻게 가는지는 다른 앱을 켜게 만드는
 *    것이 기존 앱들의 문제였다.
 *
 * 1단계 거점 도시(오사카·교토·후쿠오카·도쿄)를 우선 채웠다. 나머지 도시는
 * 대표 장소만 두고 단계적으로 확장한다. (data/cities.ts)
 */

export * from './types';

import { Place } from './types';
import { OSAKA_PLACES } from './osaka';
import { KYOTO_PLACES } from './kyoto';
import { FUKUOKA_PLACES } from './fukuoka';
import { TOKYO_PLACES } from './tokyo';
import { SAPPORO_PLACES } from './sapporo';
import { OKINAWA_PLACES } from './okinawa';

export const PLACES: Place[] = [
  ...OSAKA_PLACES,
  ...KYOTO_PLACES,
  ...FUKUOKA_PLACES,
  ...TOKYO_PLACES,
  ...SAPPORO_PLACES,
  ...OKINAWA_PLACES,
];

/**
 * 그 도시를 고른 사람에게 보여줄 장소 전부.
 *
 * `cityId` 만 보면 안 된다. 나라·우지처럼 두 도시에서 당일치기로 가는 곳은
 * `cityId` 를 한쪽에만 달아둘 수밖에 없어서, `dayTrip.from` 까지 봐야
 * 다른 쪽 거점을 고른 사람도 그곳을 볼 수 있다.
 *
 * 시내 장소를 먼저, 근교를 뒤로 보낸다. 근교는 하루를 통째로 쓰는 선택이라
 * 시내 일정을 다 훑은 다음에 고민하는 쪽이 자연스럽다.
 */
export function placesByCity(cityId: string): Place[] {
  return PLACES.filter(
    (p) => p.cityId === cityId || p.dayTrip?.from.includes(cityId),
  ).sort((a, b) => Number(!!a.dayTrip) - Number(!!b.dayTrip));
}

export function findPlace(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id);
}
