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
 * 1단계 거점 도시(오사카·교토·후쿠오카·도쿄)를 먼저 채우고, 그다음으로
 * 삿포로·마쓰야마·다카마쓰를 같은 밀도로 올렸고, 그다음 오키나와·나고야·
 * 시즈오카를 채웠다. (data/cities.ts)
 *
 * 도시 파일이 늘 때 **여기 두 줄(import 와 전개)을 같이 고쳐야 한다.** 안 그러면
 * 파일은 있는데 앱에는 안 나온다 — 타입 검사도 린트도 그걸 못 잡는다.
 */

import { Place } from './types';
import { OSAKA_PLACES } from './osaka';
import { KYOTO_PLACES } from './kyoto';
import { FUKUOKA_PLACES } from './fukuoka';
import { TOKYO_PLACES } from './tokyo';
import { SAPPORO_PLACES } from './sapporo';
import { MATSUYAMA_PLACES } from './matsuyama';
import { TAKAMATSU_PLACES } from './takamatsu';
import { OKINAWA_PLACES } from './okinawa';
import { NAGOYA_PLACES } from './nagoya';
import { SHIZUOKA_PLACES } from './shizuoka';

export * from './types';

export const PLACES: Place[] = [
  ...OSAKA_PLACES,
  ...KYOTO_PLACES,
  ...FUKUOKA_PLACES,
  ...TOKYO_PLACES,
  ...SAPPORO_PLACES,
  ...MATSUYAMA_PLACES,
  ...TAKAMATSU_PLACES,
  ...OKINAWA_PLACES,
  ...NAGOYA_PLACES,
  ...SHIZUOKA_PLACES,
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
/*
 * 도시별 색인을 **모듈이 처음 로드될 때 한 번** 만든다.
 *
 * 이 함수는 화면 여러 곳에서 렌더마다 불린다 — 도시 선택 화면은 도시 카드
 * 하나마다 부르므로, 도시 10개면 렌더 한 번에 108곳을 10번 훑는다.
 * 다른 파생 계산까지 더하면 렌더 1회에 2,600회 남짓 순회했다.
 *
 * 데이터가 **정적**이라 결과가 바뀔 일이 없다. 그러니 호출부마다 useMemo 를
 * 붙이는 것보다 여기서 한 번 계산해 두는 편이 맞다 — useMemo 는 화면이 늘 때마다
 * 빠뜨릴 수 있지만, 이건 한 곳을 고치면 모든 호출부가 같이 빨라진다.
 */
const BY_CITY = (() => {
  const map = new Map<string, Place[]>();
  const add = (cityId: string, place: Place) => {
    const list = map.get(cityId);
    if (list) list.push(place);
    else map.set(cityId, [place]);
  };

  for (const p of PLACES) {
    add(p.cityId, p);
    // 근교는 두 거점에서 다녀오는 곳이 있어(나라 = 오사카·교토) 양쪽에 넣는다.
    for (const from of p.dayTrip?.from ?? []) if (from !== p.cityId) add(from, p);
  }

  // 시내를 먼저, 근교를 뒤로. 근교는 하루를 통째로 쓰는 선택이라 시내 일정을
  // 다 훑은 다음에 고민하는 쪽이 자연스럽다.
  for (const list of map.values()) {
    list.sort((a, b) => Number(!!a.dayTrip) - Number(!!b.dayTrip));
  }
  return map;
})();

/** 없는 도시에 매번 새 배열을 만들지 않도록 빈 배열 하나를 돌려 쓴다 */
const NONE: Place[] = [];

export function placesByCity(cityId: string): Place[] {
  return BY_CITY.get(cityId) ?? NONE;
}

export function findPlace(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id);
}
