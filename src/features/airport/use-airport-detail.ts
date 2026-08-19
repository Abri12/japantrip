import { useState } from 'react';

import { Airport, CityHub, TransitRoute, hubForCity } from '@/data/airports';
import { useSelectedCity } from '@/lib/selected-city';

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
  const { city } = useSelectedCity();

  /* 사용자가 직접 고른 거점. 아무것도 안 골랐으면 null 로 두고, 아래에서
     도시 기준 기본값으로 떨어진다. */
  const [hubId, setHubId] = useState<string | null>(null);

  /* 아직 안 골랐으면 **고른 도시**의 거점을 편다. 간사이공항은 오사카와
     교토가 같이 쓰는데 늘 난바가 먼저 열려서, 교토에 묵는 사람은 자기와
     상관없는 답(45분 970엔)을 먼저 보고 있었다. 도시를 모르면 첫 거점 —
     가장 많이 묵는 곳으로 떨어진다. */
  const hub = airport
    ? (airport.hubs?.find((h) => h.id === hubId) ?? hubForCity(airport, city?.id))
    : undefined;

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
    selectHub: setHubId,
    routes,
    orphanRoutes: routes.filter((r) => !usedRouteIds.has(r.id)),
    hasApproxLastTrain: routes.some((r) => r.lastTrain?.confidence === 'approx'),
    // 좌석 지정 노선이 있으면 귀국일에는 예약을 미리 하라고 알려야 한다.
    // 도착일에는 아무 때나 타면 되지만, 돌아가는 날은 놓칠 수 없는 시각이 있다.
    hasReservedRoute: routes.some((r) => r.reserved),
    // 첫차가 확인된 노선만 추린다. 없는 노선을 「정보 없음」으로 줄 세우면,
    // 그 노선에 첫차가 없다는 뜻으로 읽힌다.
    firstTrains: routes.flatMap((route) =>
      route.firstTrain ? [{ route, firstTrain: route.firstTrain }] : [],
    ),
  };
}
