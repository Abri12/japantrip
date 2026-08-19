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
  const { city } = useSelectedCity();

  const airport = city ? AIRPORTS.find((a) => city.airportIds.includes(a.id)) : undefined;
  const best = airport ? bestWayForCity(airport, city?.id) : undefined;
  const hub = airport ? hubForCity(airport, city?.id) : undefined;

  return {
    airport,
    best,
    hubName: hub?.name,
    cityName: city?.name,
    firstTrain: best?.routeId
      ? airport?.routes.find((r) => r.id === best.routeId)?.firstTrain
      : undefined,
  };
}
