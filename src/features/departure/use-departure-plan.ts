import {
  AIRPORTS,
  Airport,
  FirstTrain,
  HubWay,
  bestWayForCity,
  findAirport,
  hubForCity,
} from '@/data/airports';
import { useSelectedCity } from '@/lib/selected-city';

/**
 * 어느 공항 기준으로 계산할지 **화면이 정해서 넘기는** 값.
 *
 * ── 왜 필요한가 ────────────────────────────────────
 *
 * 이 화면으로 들어오는 문이 두 개다. 홈에서 바로 열 수도 있고, **공항 상세
 * 화면의 「몇 시에 숙소를 나서야 하나요」를 눌러서** 올 수도 있다. 뒤쪽은
 * 「지금 보고 있는 이 공항」이라는 맥락을 달고 오는데, 그걸 안 넘기면 화면이
 * 그 맥락을 잃고 고른 도시로 되돌아간다.
 *
 * 실제로 그랬다. 공항 탭의 「전체 보기」로 후쿠오카 공항을 열고 이 줄을
 * 누르면, 도쿄를 고른 사람에게 **나리타 기준 「비행기 4시간 20분 전」**과
 * 「신주쿠·시부야에서 공항까지」가 나왔다. 후쿠오카는 3시간이 안 되는데도.
 *
 * 방향이 반대였으면 더 나빴다. 후쿠오카를 고른 사람이 나리타 화면에서
 * 눌렀다면 1시간 30분을 **모자라게** 답한다 — 되돌릴 수 없는 날에.
 */
export interface DeparturePlanInput {
  /** 공항 상세에서 넘어왔다면 그 공항의 id */
  airportId?: string;
  /** 그 화면에서 펼쳐 두었던 거점의 id */
  hubId?: string;
}

export interface DeparturePlan {
  /** 계산 기준이 되는 공항. 아무 맥락도 없으면 없다 */
  airport?: Airport;
  /** 그 공항에서 **기준 거점까지** 가는 법 */
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
 *
 * 공항을 넘겨받았으면 그쪽이 우선이다 — 사용자가 방금 그 공항을 보고 있었고,
 * 바로 그 화면에서 이 줄을 눌렀기 때문이다.
 */
export function useDeparturePlan(input: DeparturePlanInput = {}): DeparturePlan {
  const { city, hubId: savedHubId } = useSelectedCity();

  const fromScreen = input.airportId ? findAirport(input.airportId) : undefined;
  const airport =
    fromScreen ?? (city ? AIRPORTS.find((a) => city.airportIds.includes(a.id)) : undefined);

  /*
   * 넘겨받은 공항이 **고른 도시의 공항이 아닐 때**가 문제의 자리다.
   *
   * 도쿄를 고른 사람이 후쿠오카 공항을 보고 있으면, 도시에 매달린 값들
   * (저장된 거점 id · 도시 이름 · `hubForCity` 의 도시 기준)이 전부 남의
   * 값이 된다. 그대로 쓰면 후쿠오카 화면에서 「신주쿠·시부야에서 공항까지」
   * 같은 문장이 나온다. 그래서 이럴 때는 도시를 아예 안 본다.
   */
  const foreign = !!fromScreen && !city?.airportIds.includes(fromScreen.id);
  const cityId = foreign ? undefined : city?.id;

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
  const hubId = input.hubId ?? (foreign ? undefined : savedHubId);
  const hub = airport
    ? (airport.hubs?.find((h) => h.id === hubId) ?? hubForCity(airport, cityId))
    : undefined;
  const best = hub?.ways.length
    ? (hub.ways.find((w) => w.recommended) ?? hub.ways[0])
    : airport
      ? bestWayForCity(airport, cityId)
      : undefined;

  return {
    airport,
    best,
    hubName: hub?.name,
    // 남의 도시 공항을 보고 있으면 그 공항이 딸린 도시 이름을 쓴다.
    cityName: foreign ? fromScreen.city : city?.name,
    // 거점 기준 값(way.firstTrain)이 있으면 노선 값보다 먼저 쓴다.
    // 교토에 묵는 사람의 첫차는 난바가 아니라 교토역의 하루카다.
    firstTrain:
      best?.firstTrain ??
      (best?.routeId ? airport?.routes.find((r) => r.id === best.routeId)?.firstTrain : undefined),
  };
}
