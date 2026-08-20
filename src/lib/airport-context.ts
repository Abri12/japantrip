import { useState } from 'react';

import {
  AIRPORTS,
  Airport,
  CityHub,
  FirstTrain,
  HubWay,
  bestWayForCity,
  findAirport,
  hubForCity,
} from '@/data/airports';
import { useSelectedCity } from '@/lib/selected-city';

/**
 * 「지금 어느 공항 · 어느 거점 이야기인가」에 답하는 **유일한 자리.**
 *
 * ── 왜 한 곳에 모았나 ──────────────────────────────
 *
 * 이 앱에는 답이 갈리는 두 출처가 있다.
 *
 *   ① **고른 도시** — 저장돼 있고, 앱 어디서나 읽힌다
 *   ② **지금 보고 있는 화면** — URL 파라미터로 온다 (`/airport/fuk`)
 *
 * 둘이 어긋나는 순간이 있다. 공항 탭에 「전체 보기」가 있어서, 도쿄를 고른
 * 사람도 후쿠오카 공항을 열어 볼 수 있다. 그때 ①을 읽으면 후쿠오카 화면이
 * 나리타 답을 한다.
 *
 * 실제로 그렇게 됐었다. 「몇 시에 숙소를 나서야 하나요」가 **나리타 기준
 * 4시간 20분**을 답했다 — 후쿠오카는 2시간 55분인데. 방향이 반대면 1시간
 * 25분을 모자라게 답한다. 되돌릴 수 없는 날에.
 *
 * 그때는 화면 두 곳(`use-airport-detail` · `use-departure-plan`)이 **같은
 * 규칙을 따로 구현하고** 있었다. 그래서 한 곳만 고쳐도 다른 곳이 남고, 새
 * 화면이 생기면 세 번째 구현이 생긴다. 규칙을 여기 하나로 모은 이유다.
 *
 * ── 규칙 ────────────────────────────────────────
 *
 * 1. 화면이 공항을 들고 있으면(`airportId`) **그쪽이 이긴다.** 사용자가
 *    방금 그 공항을 보고 있었기 때문이다.
 * 2. 그 공항이 고른 도시의 공항이 **아니면**, 도시에 매달린 값을 아예 안
 *    쓴다 — 저장된 거점 id · 도시 이름 · `hubForCity` 의 도시 기준까지.
 *    남의 값이 하나라도 섞이면 문장이 어긋난다.
 * 3. 화면이 공항을 안 들고 있으면 고른 도시의 공항으로 떨어진다.
 *
 * `scripts/check-context.mjs` 가 이 규칙을 우회하는 코드를 잡는다.
 */
export interface AirportContextInput {
  /** 화면이 들고 있는 공항 id (라우트 파라미터). 없으면 고른 도시로 떨어진다 */
  airportId?: string;
  /** 화면이 들고 있는 거점 id. 없으면 저장된 값이나 도시 기준 기본값 */
  hubId?: string;
}

export interface AirportContext {
  /** 계산 기준이 되는 공항. 맥락이 아무것도 없으면 없다 */
  airport?: Airport;
  /** 지금 펼쳐 둔 거점. 거점이 없는 공항은 undefined */
  hub?: CityHub;
  /** 그 거점까지 가는 가장 무난한 방법 */
  best?: HubWay;
  /** 화면에 적을 도시 이름 — 남의 도시 공항이면 그 공항이 딸린 도시 */
  cityName?: string;
  /** `best` 가 쓰는 노선의 시내 → 공항 첫차 */
  firstTrain?: FirstTrain;
  /**
   * 이 공항이 **고른 도시의 공항인지.**
   *
   * 거점 선택을 저장해도 되는지의 기준이다. 남의 도시 공항을 구경하다 고른
   * 거점을 저장하면, 내 도시의 거점 선택을 덮어쓴다 — 도쿄에서 아사쿠사를
   * 골라 두고 후쿠오카 공항에서 텐진을 눌렀다 돌아오면 아사쿠사가 사라진다.
   */
  ownCity: boolean;
  /** 거점을 바꾼다. 내 도시 공항일 때만 저장되고, 아니면 화면 안에만 남는다 */
  selectHub: (hubId: string) => void;
}

export function useAirportContext(input: AirportContextInput = {}): AirportContext {
  const { city, hubId: savedHubId, selectHub: saveHub } = useSelectedCity();

  /* 남의 도시 공항을 구경하는 동안의 거점 선택. 저장하지 않고 화면 안에만 둔다 */
  const [browsedHubId, setBrowsedHubId] = useState<string | null>(null);

  const fromScreen = input.airportId ? findAirport(input.airportId) : undefined;
  const airport =
    fromScreen ?? (city ? AIRPORTS.find((a) => city.airportIds.includes(a.id)) : undefined);

  // 규칙 2 — 고른 도시의 공항이 아니면 도시에 매달린 값을 안 쓴다
  const ownCity = !!airport && !!city?.airportIds.includes(airport.id);
  const cityId = ownCity ? city?.id : undefined;

  const hubId = input.hubId ?? (ownCity ? savedHubId : browsedHubId);
  const hub = airport
    ? (airport.hubs?.find((h) => h.id === hubId) ?? hubForCity(airport, cityId))
    : undefined;

  /*
   * 거점의 방법 중 추천, 없으면 첫 번째.
   *
   * 거점이 없는 공항(마쓰야마·다카마쓰)은 `bestWayForCity` 로 떨어지는데,
   * 그쪽도 결국 같은 규칙을 쓴다. 여기서 cityId 를 넘기는 것이 중요하다 —
   * 남의 도시 공항에 내 도시 id 를 넘기면 엉뚱한 거점을 집는다.
   */
  const best = hub?.ways.length
    ? (hub.ways.find((w) => w.recommended) ?? hub.ways[0])
    : airport
      ? bestWayForCity(airport, cityId)
      : undefined;

  return {
    airport,
    hub,
    best,
    cityName: ownCity ? city?.name : airport?.city,
    // 거점 기준 값(way.firstTrain)이 있으면 노선 값보다 먼저 쓴다.
    // 교토에 묵는 사람의 첫차는 난바가 아니라 교토역의 하루카다.
    firstTrain:
      best?.firstTrain ??
      (best?.routeId ? airport?.routes.find((r) => r.id === best.routeId)?.firstTrain : undefined),
    ownCity,
    selectHub: ownCity ? saveHub : setBrowsedHubId,
  };
}
