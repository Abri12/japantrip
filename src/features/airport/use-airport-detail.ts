import { Airport, CityHub, TransitRoute } from '@/data/airports';
import { useAirportContext } from '@/lib/airport-context';

import { FirstTrainEntry } from './return-trip-section';

/** 화면이 그리는 데 필요한 것 전부 */
export interface AirportDetailView {
  /** 지금 펼쳐 둔 거점. 거점이 없는 공항은 undefined */
  hub?: CityHub;
  selectHub: (hubId: string) => void;
  routes: TransitRoute[];
  /** 어느 거점에도 안 걸리는 노선 */
  orphanRoutes: TransitRoute[];
  hasApproxLastTrain: boolean;
  hasReservedRoute: boolean;
  firstTrains: FirstTrainEntry[];
}

/**
 * 공항 상세 화면의 파생값을 한곳에서 계산한다.
 *
 * `airport` 를 **선택 인자로 받는 이유**가 중요하다. 화면에는 「공항을 못
 * 찾음」 이른 return 이 있어서, 훅을 그 뒤에서 부르면 렌더마다 훅 개수가
 * 달라진다. 그래서 못 찾은 경우까지 이 훅이 삼키고, 화면은 훅을 부른 뒤에
 * 이른 return 을 한다.
 */
export function useAirportDetail(airport?: Airport): AirportDetailView {
  /* 어느 거점을 펼칠지, 그 선택을 저장해도 되는지는 이 훅이 정하지 않는다.
     귀국일 화면과 **같은 규칙**이어야 하므로 한 자리에서 답한다
     (`lib/airport-context`). 예전에는 두 화면이 따로 구현하고 있었고,
     그래서 규칙이 어긋나 있었다. */
  const { hub, selectHub } = useAirportContext({ airportId: airport?.id });

  const routes = airport?.routes ?? [];

  /*
   * 어느 거점에도 안 걸리는 노선.
   *
   * 나하의 렌터카 셔틀이 그렇다 — 시내가 아니라 렌터카 영업소로 간다. 거점
   * 목록에 억지로 끼워 넣으면 「고쿠사이도리 가는 법」인 척하게 되고, 그냥
   * 빼면 북부로 갈 사람이 셔틀이 있다는 걸 모른다. 그래서 따로 둔다.
   */
  const usedRouteIds = new Set(
    (airport?.hubs ?? []).flatMap((h) => h.ways.map((w) => w.routeId)).filter(Boolean),
  );

  return {
    hub,
    selectHub,
    routes,
    orphanRoutes: routes.filter((r) => !usedRouteIds.has(r.id)),
    hasApproxLastTrain: routes.some((r) => r.lastTrain?.confidence === 'approx'),
    // 좌석 지정 노선이 있으면 귀국일에는 예약을 미리 하라고 알려야 한다.
    // 도착일에는 아무 때나 타면 되지만, 돌아가는 날은 놓칠 수 없는 시각이 있다.
    hasReservedRoute: routes.some((r) => r.reserved),
    firstTrains: firstTrainsForHub(hub, routes),
  };
}

/**
 * 「시내에서 타는 첫차」 — **고른 거점** 기준으로 추린다.
 *
 * 예전에는 첫차가 있는 노선을 전부 보여줬다. 그래서 교토 거점을 골라도
 * 난카이 난바 05:15 가 그대로 떠 있었다 — 교토에 묵는 사람에게는 남의
 * 답인데, 자리만 보면 자기 답처럼 읽힌다.
 *
 * 규칙: 거점의 방법(`ways`)이 쓰는 노선만 남기고, 거점 기준 값
 * (`way.firstTrain`)이 있으면 그걸 노선 값보다 먼저 쓴다. 노선 값으로
 * 떨어질 때도 `from` 역 이름이 함께 나가므로 어디 기준인지는 드러난다.
 * 거점이 없는 공항은 예전대로 전부 보여준다.
 */
function firstTrainsForHub(hub: CityHub | undefined, routes: TransitRoute[]): FirstTrainEntry[] {
  if (!hub) {
    return routes.flatMap((route) =>
      route.firstTrain ? [{ route, firstTrain: route.firstTrain }] : [],
    );
  }

  const seen = new Set<string>();
  const entries: FirstTrainEntry[] = [];
  for (const way of hub.ways) {
    if (!way.routeId || seen.has(way.routeId)) continue;
    seen.add(way.routeId);
    const route = routes.find((r) => r.id === way.routeId);
    const firstTrain = way.firstTrain ?? route?.firstTrain;
    if (route && firstTrain) entries.push({ route, firstTrain });
  }
  return entries;
}
