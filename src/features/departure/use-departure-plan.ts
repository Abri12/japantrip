import { AIRPORTS, Airport, FirstTrain, HubWay, bestWayForCity, hubForCity } from '@/data/airports';
import { useSelectedCity } from '@/lib/selected-city';

export interface DeparturePlan {
  /** 고른 도시로 들어오는 첫 공항. 도시를 안 골랐으면 없다 */
  airport?: Airport;
  /** 그 공항에서 **고른 도시까지** 가는 법 */
  best?: HubWay;
  /** 시간을 재기 시작하는 거점 */
  hubName?: string;
  cityName?: string;
  /** `best` 가 쓰는 노선의 시내 → 공항 첫차 */
  firstTrain?: FirstTrain;
}

/**
 * 귀국일 계산이 딛고 서는 값들.
 *
 * 기준은 **고른 도시까지** 가는 법이지, 「이 공항의 추천 노선」이 아니다.
 * 예전에는 `airport.routes` 에서 recommended 를 집었는데, 간사이공항은
 * 오사카와 교토가 같이 쓰는 공항이라 교토에 묵는 사람에게도 난바까지의
 * 45분을 답했다. 교토는 하루카로 80분이다. 그 35분이 그대로 모자라서,
 * 되돌릴 수 없는 날에 「비행기 3시간 15분 전」이라고 말하고 있었다.
 */
export function useDeparturePlan(): DeparturePlan {
  const { city, hubId } = useSelectedCity();

  const airport = city ? AIRPORTS.find((a) => city.airportIds.includes(a.id)) : undefined;

  /*
   * 공항 화면에서 고른 거점을 그대로 따른다.
   *
   * 예전에는 `hubForCity` 만 써서 **도시의 첫 거점**으로 고정됐다. 오사카는
   * 첫 거점이 난바라, 우메다나 텐노지에 묵는 사람이 공항 화면에서 자기 거점을
   * 고르고 이 화면으로 넘어와도 난바 기준 시간을 받았다. 텐노지는 60분,
   * 우메다는 70분인데 난바 45분으로 계산하면 **되돌릴 수 없는 날에 15~25분이
   * 모자란다.**
   *
   * 아직 아무것도 안 골랐으면 예전처럼 도시 기준 기본값으로 떨어진다.
   */
  const hub = airport
    ? (airport.hubs?.find((h) => h.id === hubId) ?? hubForCity(airport, city?.id))
    : undefined;
  const best = hub?.ways.length
    ? (hub.ways.find((w) => w.recommended) ?? hub.ways[0])
    : airport
      ? bestWayForCity(airport, city?.id)
      : undefined;

  return {
    airport,
    best,
    hubName: hub?.name,
    cityName: city?.name,
    // 거점 기준 값(way.firstTrain)이 있으면 노선 값보다 먼저 쓴다.
    // 교토에 묵는 사람의 첫차는 난바가 아니라 교토역의 하루카다.
    firstTrain:
      best?.firstTrain ??
      (best?.routeId ? airport?.routes.find((r) => r.id === best.routeId)?.firstTrain : undefined),
  };
}
